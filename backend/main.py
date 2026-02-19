from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import sqlite3, uuid, json, re

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

DB_FILE = "storymap.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT)')
    conn.execute('CREATE TABLE IF NOT EXISTS nodes (id TEXT, label TEXT, sect TEXT, project_id TEXT, PRIMARY KEY(id, project_id))')
    conn.execute('''CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY, 
        source TEXT, 
        target TEXT, 
        label TEXT, 
        project_id TEXT,
        stage TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS llm_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        protocol TEXT NOT NULL,
        api_key TEXT NOT NULL,
        base_url TEXT NOT NULL,
        model_id TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()

init_db()

class LLMConfig(BaseModel):
    api_key: str
    base_url: str
    model: str

class LLMModel(BaseModel):
    name: str
    protocol: str  # openai, volcano, bailian
    api_key: str
    base_url: str
    model_id: str
    is_default: bool = False

class TestLLMRequest(BaseModel):
    api_key: str
    base_url: str
    model_id: str
    protocol: str

class AnalyzeRequest(BaseModel):
    text: str
    config: LLMConfig
    system_prompt: str

@app.get("/api/projects")
def list_projs():
    conn = get_db()
    res = [dict(r) for r in conn.execute("SELECT * FROM projects").fetchall()]
    conn.close()
    return res

@app.post("/api/projects")
def add_proj(p: dict):
    conn = get_db()
    pid = f"proj_{uuid.uuid4().hex[:6]}"
    conn.execute("INSERT INTO projects VALUES (?,?)", (pid, p['name']))
    conn.commit()
    conn.close()
    return {"id": pid, "name": p['name']}

@app.delete("/api/projects/{pid}")
def delete_proj(pid: str):
    """删除项目及其所有数据"""
    conn = get_db()
    conn.execute("DELETE FROM projects WHERE id=?", (pid,))
    conn.execute("DELETE FROM nodes WHERE project_id=?", (pid,))
    conn.execute("DELETE FROM edges WHERE project_id=?", (pid,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.put("/api/projects/{pid}")
def rename_proj(pid: str, p: dict):
    """重命名项目"""
    conn = get_db()
    conn.execute("UPDATE projects SET name=? WHERE id=?", (p['name'], pid))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/projects/{pid}/data")
def get_data(pid: str):
    conn = get_db()
    nodes = [dict(r) for r in conn.execute("SELECT * FROM nodes WHERE project_id=?", (pid,)).fetchall()]
    edges = [dict(r) for r in conn.execute("SELECT * FROM edges WHERE project_id=?", (pid,)).fetchall()]
    
    # 数据验证：过滤掉无效的边
    node_ids = {n['id'] for n in nodes}
    valid_edges = []
    invalid_count = 0
    
    for edge in edges:
        if edge['source'] in node_ids and edge['target'] in node_ids:
            valid_edges.append(edge)
        else:
            invalid_count += 1
            print(f"⚠️ 发现无效边: {edge['id']}, source={edge['source']}, target={edge['target']}")
    
    if invalid_count > 0:
        print(f"✓ 过滤了 {invalid_count} 条无效边")
    
    conn.close()
    return {"nodes": nodes, "edges": valid_edges}

@app.post("/api/projects/{pid}/cleanup")
def cleanup_duplicates(pid: str):
    """清理重复节点和孤立边"""
    conn = get_db()
    
    # 1. 找出所有重复的节点（相同 label）
    duplicates = conn.execute("""
        SELECT label, GROUP_CONCAT(id) as ids, COUNT(*) as cnt
        FROM nodes 
        WHERE project_id=?
        GROUP BY label
        HAVING cnt > 1
    """, (pid,)).fetchall()
    
    merged_count = 0
    for dup in duplicates:
        ids = dup['ids'].split(',')
        keep_id = ids[0]  # 保留第一个 ID
        remove_ids = ids[1:]  # 删除其他 ID
        
        # 更新所有使用旧 ID 的边
        for old_id in remove_ids:
            conn.execute("UPDATE edges SET source=? WHERE source=? AND project_id=?", (keep_id, old_id, pid))
            conn.execute("UPDATE edges SET target=? WHERE target=? AND project_id=?", (keep_id, old_id, pid))
            conn.execute("DELETE FROM nodes WHERE id=? AND project_id=?", (old_id, pid))
        
        merged_count += len(remove_ids)
    
    # 2. 删除孤立的边（source 或 target 不存在）
    orphan_edges = conn.execute("""
        SELECT e.id, e.source, e.target FROM edges e
        WHERE e.project_id=?
        AND (
            NOT EXISTS (SELECT 1 FROM nodes WHERE id=e.source AND project_id=e.project_id)
            OR NOT EXISTS (SELECT 1 FROM nodes WHERE id=e.target AND project_id=e.project_id)
        )
    """, (pid,)).fetchall()
    
    orphan_count = len(orphan_edges)
    for edge in orphan_edges:
        print(f"删除孤立边: {edge['id']}, source={edge['source']}, target={edge['target']}")
        conn.execute("DELETE FROM edges WHERE id=?", (edge['id'],))
    
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "merged_nodes": merged_count,
        "removed_edges": orphan_count
    }

@app.post("/api/projects/{pid}/analyze")
def analyze(pid: str, req: AnalyzeRequest):
    try:
        client = OpenAI(api_key=req.config.api_key, base_url=req.config.base_url)
        resp = client.chat.completions.create(
            model=req.config.model,
            messages=[{"role":"system","content":req.system_prompt},{"role":"user","content":req.text}]
        )
        raw = resp.choices[0].message.content.strip()
        
        # 强力正则：提取第一个 { 到最后一个 } 之间的内容
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match: return {"status": "error", "message": "AI未返回标准JSON"}
        
        data = json.loads(match.group())
        conn = get_db()
        
        # 节点入库 - 强化去重：按姓名去重，统一使用第一次出现的 ID
        node_id_map = {}  # 用于记录姓名到 ID 的映射
        
        for n in data.get('nodes', []):
            node_id = str(n['id']).strip()
            label = str(n['label']).strip()
            sect = str(n.get('sect', '未知')).strip()
            
            # 检查数据库中是否已存在同名节点
            existing = conn.execute(
                "SELECT id, sect FROM nodes WHERE project_id=? AND label=?", 
                (pid, label)
            ).fetchone()
            
            if existing:
                # 已存在同名节点，使用数据库中的 ID
                final_id = existing['id']
                node_id_map[node_id] = final_id  # 记录 ID 映射
                
                # 更新门派信息（如果新信息更详细）
                if sect and sect != '未知' and (not existing['sect'] or existing['sect'] == '未知'):
                    conn.execute(
                        "UPDATE nodes SET sect=? WHERE id=? AND project_id=?",
                        (sect, final_id, pid)
                    )
            else:
                # 新节点，直接插入
                final_id = node_id
                node_id_map[node_id] = final_id
                conn.execute(
                    "INSERT INTO nodes VALUES (?,?,?,?)", 
                    (final_id, label, sect, pid)
                )
        
        # 关系入库 - 使用映射后的 ID，合并为复合关系
        for e in data.get('edges', []):
            source = str(e['source']).strip()
            target = str(e['target']).strip()
            label = str(e.get('label', '关联')).strip()
            
            # 使用映射后的 ID（如果有映射的话）
            source = node_id_map.get(source, source)
            target = node_id_map.get(target, target)
            
            # 检查是否已存在该对人物的关系（不管 label）
            existing = conn.execute(
                "SELECT id, label FROM edges WHERE project_id=? AND source=? AND target=?",
                (pid, source, target)
            ).fetchone()
            
            if existing:
                # 已存在关系，合并 label
                existing_labels = existing['label'].split(' → ')
                
                # 如果新关系不在已有关系中，追加
                if label not in existing_labels:
                    new_label = existing['label'] + ' → ' + label
                    conn.execute(
                        "UPDATE edges SET label=? WHERE id=?",
                        (new_label, existing['id'])
                    )
            else:
                # 不存在，创建新关系
                eid = f"edge_{uuid.uuid4().hex[:8]}"
                conn.execute(
                    "INSERT INTO edges (id, source, target, label, project_id) VALUES (?,?,?,?,?)", 
                    (eid, source, target, label, pid)
                )
        
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/projects/{pid}/export")
def export_p(pid: str):
    conn = get_db()
    p = conn.execute("SELECT * FROM projects WHERE id=?", (pid,)).fetchone()
    nodes = [dict(r) for r in conn.execute("SELECT * FROM nodes WHERE project_id=?", (pid,)).fetchall()]
    edges = [dict(r) for r in conn.execute("SELECT * FROM edges WHERE project_id=?", (pid,)).fetchall()]
    conn.close()
    return {"project": dict(p), "nodes": nodes, "edges": edges}

@app.post("/api/projects/import")
def import_p(data: dict):
    conn = get_db()
    new_pid = f"proj_{uuid.uuid4().hex[:6]}"
    conn.execute("INSERT INTO projects VALUES (?,?)", (new_pid, data['project']['name']))
    for n in data['nodes']:
        conn.execute("INSERT OR REPLACE INTO nodes VALUES (?,?,?,?)", (n['id'], n['label'], n.get('sect',''), new_pid))
    for e in data['edges']:
        eid = f"edge_{uuid.uuid4().hex[:8]}"
        conn.execute("INSERT INTO edges (id, source, target, label, project_id) VALUES (?,?,?,?,?)", 
                    (eid, e['source'], e['target'], e['label'], new_pid))
    conn.commit()
    conn.close()
    return {"status": "success", "project_id": new_pid}

# ==================== LLM 模型管理接口 ====================

@app.get("/api/llm-models")
def list_llm_models():
    """获取所有 LLM 模型配置"""
    conn = get_db()
    models = [dict(r) for r in conn.execute("SELECT * FROM llm_models ORDER BY is_default DESC, created_at DESC").fetchall()]
    conn.close()
    return models

@app.post("/api/llm-models")
def add_llm_model(model: LLMModel):
    """添加新的 LLM 模型配置"""
    conn = get_db()
    model_id = f"llm_{uuid.uuid4().hex[:8]}"
    
    # 如果设置为默认，先取消其他默认模型
    if model.is_default:
        conn.execute("UPDATE llm_models SET is_default = 0")
    
    conn.execute(
        "INSERT INTO llm_models (id, name, protocol, api_key, base_url, model_id, is_default) VALUES (?,?,?,?,?,?,?)",
        (model_id, model.name, model.protocol, model.api_key, model.base_url, model.model_id, 1 if model.is_default else 0)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "id": model_id}

@app.put("/api/llm-models/{model_id}")
def update_llm_model(model_id: str, model: LLMModel):
    """更新 LLM 模型配置"""
    conn = get_db()
    
    # 如果设置为默认，先取消其他默认模型
    if model.is_default:
        conn.execute("UPDATE llm_models SET is_default = 0")
    
    conn.execute(
        "UPDATE llm_models SET name=?, protocol=?, api_key=?, base_url=?, model_id=?, is_default=? WHERE id=?",
        (model.name, model.protocol, model.api_key, model.base_url, model.model_id, 1 if model.is_default else 0, model_id)
    )
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.delete("/api/llm-models/{model_id}")
def delete_llm_model(model_id: str):
    """删除 LLM 模型配置"""
    conn = get_db()
    conn.execute("DELETE FROM llm_models WHERE id=?", (model_id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post("/api/llm-models/test")
def test_llm_model(req: TestLLMRequest):
    """测试 LLM 模型连接"""
    try:
        # 根据协议构建不同的请求头
        headers = {}
        if req.protocol == "volcano":
            # 火山方舟使用 Authorization: Bearer
            headers = {"Authorization": f"Bearer {req.api_key}"}
        elif req.protocol == "bailian":
            # 百炼使用 X-DashScope-SSE: enable
            headers = {"Authorization": f"Bearer {req.api_key}", "X-DashScope-SSE": "enable"}
        
        client = OpenAI(
            api_key=req.api_key, 
            base_url=req.base_url,
            default_headers=headers if headers else None
        )
        
        # 发送测试消息
        resp = client.chat.completions.create(
            model=req.model_id,
            messages=[{"role": "user", "content": "你好，请回复'测试成功'"}],
            max_tokens=50
        )
        
        content = resp.choices[0].message.content.strip()
        return {
            "status": "success", 
            "message": "连接成功",
            "response": content,
            "model": resp.model
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/llm-models/default")
def get_default_model():
    """获取默认 LLM 模型"""
    conn = get_db()
    model = conn.execute("SELECT * FROM llm_models WHERE is_default=1 LIMIT 1").fetchone()
    conn.close()
    if model:
        return dict(model)
    return None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)