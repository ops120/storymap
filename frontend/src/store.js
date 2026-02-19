import { create } from 'zustand';
import { loadConfig, saveConfig } from './config';

const API_BASE = 'http://127.0.0.1:8000/api';

// 加载配置
const config = loadConfig();

export const useStore = create((set, get) => ({
  projects: [],
  currentProjectId: null,
  nodes: [],
  edges: [],
  isAnalyzing: false,
  isLoadingProject: false,
  progress: 0,
  systemPrompt: config.systemPrompt,
  chunkSize: config.defaultChunkSize,
  debug: config.debug,
  llmModels: [],
  currentLlmId: null,
  llmConfig: JSON.parse(localStorage.getItem('llm_config')) || {
    api_key: '', 
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', 
    model: 'qwen-plus'
  },

  setChunkSize: (size) => {
    set({ chunkSize: size });
    const cfg = loadConfig();
    cfg.defaultChunkSize = size;
    saveConfig(cfg);
  },

  setDebug: (debug) => {
    set({ debug });
    const cfg = loadConfig();
    cfg.debug = debug;
    saveConfig(cfg);
    console.log('Debug 模式:', debug ? '开启' : '关闭');
  },

  setSystemPrompt: (prompt) => {
    set({ systemPrompt: prompt });
    const cfg = loadConfig();
    cfg.systemPrompt = prompt;
    saveConfig(cfg);
  },

  setLlmConfig: (config) => {
    set({ llmConfig: config });
    localStorage.setItem('llm_config', JSON.stringify(config));
  },

  // ==================== LLM 模型管理 ====================
  
  fetchLlmModels: async () => {
    try {
      const res = await fetch(`${API_BASE}/llm-models`);
      const data = await res.json();
      set({ llmModels: data });
      
      // 自动选择默认模型
      const defaultModel = data.find(m => m.is_default);
      if (defaultModel && !get().currentLlmId) {
        set({ currentLlmId: defaultModel.id });
      }
    } catch (e) { console.error("获取 LLM 模型失败", e); }
  },

  addLlmModel: async (model) => {
    try {
      const res = await fetch(`${API_BASE}/llm-models`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(model)
      });
      const r = await res.json();
      if (r.status === 'success') {
        await get().fetchLlmModels();
        return { success: true, id: r.id };
      }
      return { success: false, message: r.message };
    } catch (e) { 
      console.error("添加 LLM 模型失败", e);
      return { success: false, message: e.message };
    }
  },

  updateLlmModel: async (id, model) => {
    try {
      const res = await fetch(`${API_BASE}/llm-models/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(model)
      });
      const r = await res.json();
      if (r.status === 'success') {
        await get().fetchLlmModels();
        return { success: true };
      }
      return { success: false };
    } catch (e) { 
      console.error("更新 LLM 模型失败", e);
      return { success: false };
    }
  },

  deleteLlmModel: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/llm-models/${id}`, { method: 'DELETE' });
      const r = await res.json();
      if (r.status === 'success') {
        await get().fetchLlmModels();
        if (get().currentLlmId === id) {
          set({ currentLlmId: null });
        }
        return { success: true };
      }
      return { success: false };
    } catch (e) { 
      console.error("删除 LLM 模型失败", e);
      return { success: false };
    }
  },

  testLlmModel: async (config) => {
    try {
      const res = await fetch(`${API_BASE}/llm-models/test`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(config)
      });
      return await res.json();
    } catch (e) { 
      console.error("测试 LLM 模型失败", e);
      return { status: 'error', message: e.message };
    }
  },

  selectLlmModel: (id) => {
    set({ currentLlmId: id });
  },

  fetchProjects: async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      set({ projects: data });
    } catch (e) { console.error("获取项目失败", e); }
  },

  // ✅ 快速切换 + 异步加载
  selectProject: async (pid) => {
    console.log('=== 开始切换项目 ===');
    console.log('目标项目ID:', pid);
    
    // 立即切换项目ID，清空数据，显示加载状态
    set({ 
      currentProjectId: pid, 
      nodes: [], 
      edges: [], 
      isLoadingProject: true 
    });
    
    console.log('✓ 已设置 isLoadingProject = true');
    
    // 确保加载状态至少显示 300ms，让用户能看到
    const startTime = Date.now();
    
    // 异步加载数据
    try {
      const res = await fetch(`${API_BASE}/projects/${pid}/data`);
      const data = await res.json();
      console.log('✓ 项目数据加载完成:', data);
      console.log('节点数量:', data.nodes?.length || 0);
      console.log('关系数量:', data.edges?.length || 0);
      
      // 确保至少显示 300ms 的加载状态
      const elapsed = Date.now() - startTime;
      const minDelay = 300;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      
      // 数据加载完成后更新
      set({ 
        nodes: data.nodes || [], 
        edges: data.edges || [],
        isLoadingProject: false
      });
      
      console.log('✓ 已设置 isLoadingProject = false');
      console.log('=== 项目切换完成 ===');
    } catch (e) { 
      console.error("✗ 获取项目数据失败", e); 
      set({ 
        nodes: [], 
        edges: [],
        isLoadingProject: false
      });
    }
  },

  createProject: async (name) => {
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name })
      });
      const p = await res.json();
      await get().fetchProjects();
      get().selectProject(p.id);
    } catch (e) { console.error("创建项目失败", e); }
  },

  deleteProject: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await get().fetchProjects();
        if (get().currentProjectId === id) {
          set({ currentProjectId: null, nodes: [], edges: [] });
        }
      }
    } catch (e) { console.error("删除项目失败", e); }
  },

  renameProject: async (id, newName) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        await get().fetchProjects();
      }
    } catch (e) { console.error("重命名项目失败", e); }
  },

  cleanupDuplicates: async (projectId) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/cleanup`, {
        method: 'POST'
      });
      
      if (res.status === 404) {
        // 后端接口不存在，使用前端清理方案
        console.log('使用前端清理方案...');
        const data = await fetch(`${API_BASE}/projects/${projectId}/data`).then(r => r.json());
        
        // 找出重复的节点
        const labelMap = {};
        data.nodes.forEach(node => {
          if (!labelMap[node.label]) {
            labelMap[node.label] = [];
          }
          labelMap[node.label].push(node);
        });
        
        let mergedCount = 0;
        const nodesToDelete = [];
        const idMapping = {};
        
        // 处理重复节点
        Object.entries(labelMap).forEach(([label, nodes]) => {
          if (nodes.length > 1) {
            const keepNode = nodes[0];
            for (let i = 1; i < nodes.length; i++) {
              idMapping[nodes[i].id] = keepNode.id;
              nodesToDelete.push(nodes[i].id);
              mergedCount++;
            }
          }
        });
        
        // 更新边的引用
        const updatedEdges = data.edges.map(edge => ({
          ...edge,
          source: idMapping[edge.source] || edge.source,
          target: idMapping[edge.target] || edge.target
        }));
        
        // 删除重复的边
        const edgeSet = new Set();
        const finalEdges = updatedEdges.filter(edge => {
          const key = `${edge.source}-${edge.target}-${edge.label}`;
          if (edgeSet.has(key)) return false;
          edgeSet.add(key);
          return true;
        });
        
        const removedEdges = updatedEdges.length - finalEdges.length;
        
        // 导出并重新导入（这是最简单的更新方式）
        const exportData = {
          project: { name: get().projects.find(p => p.id === projectId)?.name || 'Cleaned' },
          nodes: data.nodes.filter(n => !nodesToDelete.includes(n.id)),
          edges: finalEdges
        };
        
        // 删除旧项目
        await fetch(`${API_BASE}/projects/${projectId}`, { method: 'DELETE' });
        
        // 重新导入
        const importRes = await fetch(`${API_BASE}/projects/import`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(exportData)
        });
        const result = await importRes.json();
        
        // 刷新项目列表并选择新项目
        await get().fetchProjects();
        await get().selectProject(result.project_id);
        
        return {
          status: 'success',
          merged_nodes: mergedCount,
          removed_edges: removedEdges
        };
      }
      
      const result = await res.json();
      if (result.status === 'success') {
        console.log(`清理完成: 合并了 ${result.merged_nodes} 个重复节点，删除了 ${result.removed_edges} 条孤立边`);
        await get().selectProject(projectId);
        return result;
      }
    } catch (e) { 
      console.error("清理失败", e); 
      return null;
    }
  },

  analyzeText: async (fullText) => {
    const { currentProjectId, currentLlmId, llmModels, systemPrompt, chunkSize, debug } = get();
    if (!currentProjectId || !fullText.trim()) return;
    
    // 获取当前选中的 LLM 配置
    const selectedModel = llmModels.find(m => m.id === currentLlmId);
    if (!selectedModel) {
      console.error("请先选择一个 LLM 模型");
      alert("请先在'法阵管理'中配置并选择一个 LLM 模型");
      return;
    }
    
    if (debug) {
      console.log('=== Debug 模式：开始分析 ===');
      console.log('项目ID:', currentProjectId);
      console.log('模型配置:', {
        name: selectedModel.name,
        protocol: selectedModel.protocol,
        model_id: selectedModel.model_id,
        base_url: selectedModel.base_url
      });
      console.log('系统提示词:', systemPrompt);
      console.log('文本长度:', fullText.length);
      console.log('切片大小:', chunkSize);
    }
    
    const llmConfig = {
      api_key: selectedModel.api_key,
      base_url: selectedModel.base_url,
      model: selectedModel.model_id
    };
    
    const chunks = [];
    for (let i = 0; i < fullText.length; i += chunkSize) {
      chunks.push(fullText.slice(i, i + chunkSize));
    }
    
    if (debug) {
      console.log(`文本分为 ${chunks.length} 个切片`);
      console.log('切片预览:', chunks.map((c, i) => `切片${i + 1}: ${c.substring(0, 50)}...`));
    }

    set({ isAnalyzing: true, progress: 0 });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        if (debug) {
          console.log(`\n=== 切片 ${i + 1}/${chunks.length} ===`);
          console.log('发送内容:', chunks[i]);
          console.log('完整请求:', {
            system: systemPrompt,
            user: chunks[i],
            model: llmConfig.model,
            base_url: llmConfig.base_url
          });
        }
        
        const res = await fetch(`${API_BASE}/projects/${currentProjectId}/analyze`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            text: chunks[i], 
            config: llmConfig, 
            system_prompt: systemPrompt 
          })
        });
        const r = await res.json();
        
        if (debug) {
          console.log('API 响应:', r);
        }
        
        if (r.status === 'success') {
          successCount++;
          if (debug) console.log(`✓ 切片 ${i + 1} 分析成功`);
        } else {
          errorCount++;
          console.error(`✗ 切片 ${i + 1} 分析失败:`, r.message);
        }
      } catch (e) { 
        errorCount++;
        console.error(`✗ 切片 ${i + 1} 请求失败:`, e); 
      }
      set({ progress: Math.round(((i + 1) / chunks.length) * 100) });
    }
    
    if (debug) {
      console.log('\n=== 分析完成 ===');
      console.log(`成功: ${successCount}/${chunks.length}`);
      console.log(`失败: ${errorCount}/${chunks.length}`);
    }
    
    // 重新拉取最新数据
    await get().selectProject(currentProjectId);
    set({ isAnalyzing: false, progress: 0 });
    
    if (successCount > 0) {
      console.log('✓ 数据已更新，图谱应该显示了');
    } else {
      console.error('✗ 所有切片都失败了，请检查 LLM 配置');
      alert('分析失败，请检查 LLM 配置和网络连接');
    }
  },

  exportProject: async () => {
    const { currentProjectId, projects } = get();
    if (!currentProjectId) {
      alert('请先选择一个项目');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/projects/${currentProjectId}/export`);
      const data = await res.json();
      
      const project = projects.find(p => p.id === currentProjectId);
      const exportData = {
        project: { name: project?.name || 'Untitled' },
        nodes: data.nodes || [],
        edges: data.edges || []
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('项目导出成功');
    } catch (e) {
      console.error('导出项目失败', e);
      alert('导出失败: ' + e.message);
    }
  },

  importProject: async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const res = await fetch(`${API_BASE}/projects/import`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      if (result.status === 'success') {
        console.log('项目导入成功:', result);
        await get().fetchProjects();
        await get().selectProject(result.project_id);
        alert('导入成功！');
      } else {
        throw new Error(result.message || '导入失败');
      }
    } catch (e) {
      console.error('导入项目失败', e);
      alert('导入失败: ' + e.message);
    }
  }
}));