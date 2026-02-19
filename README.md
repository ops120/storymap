# 众生谱 (StoryMap) v2.4

基于大语言模型的叙事资产管理工具，自动提取小说人物关系网络。

**作者：你们喜爱的老王**

## 🎉 v2.4 新特性

- ⚡ **快速切换**：卷宗切换立即响应，加载状态可视化
- 🎨 **智能布局**：根据数据量自动选择最优布局算法
- 🔧 **数据修复**：自动过滤无效边，确保图谱正常显示
- 📊 **字数统计**：实时显示文本总字数
- ✨ **界面优化**：作者信息更显眼，加载动画更友好

[查看完整更新日志](CHANGELOG-v2.4.md)

## ✨ 核心功能

- 📚 **多项目管理**：支持多个小说卷宗独立管理，可重命名、删除
- 🔮 **多模型支持**：支持 OpenAI、火山方舟、阿里百炼三种协议
- 🧪 **模型测试**：添加前可测试连接，确保配置正确
- 🕸️ **关系图谱**：基于 G6 引擎的动态力导向布局
- 💾 **数据持久化**：SQLite 数据库存储，支持导入导出
- 🤖 **智能解析**：AI 自动提取人物、势力、关系
- 📝 **文本导入**：支持粘贴文本或导入 .txt 文件（自动检测编码）
- 🔄 **关系演变**：自动合并关系演变（同学 → 恋人 → 夫妻 → 离婚）
- 🧹 **智能去重**：自动清理重复节点和孤立边
- 🎨 **可调布局**：三栏布局可自由拖拽调整宽度
- ⚙️ **配置管理**：自定义系统提示词、切片大小、Debug 模式

## 🚀 快速开始

### 环境要求

- Python 3.10+（推荐使用 Conda 环境 `vevo`）
- Node.js 16+
- Anaconda 或 Miniconda（推荐）

### 1. 安装依赖

#### 使用 Conda 环境（推荐）

```bash
# 方式一：使用现有 vevo 环境
conda activate vevo
pip install -r requirements.txt

# 方式二：创建新的 vevo 环境
conda env create -f environment.yml
conda activate vevo

# 方式三：手动创建
conda create -n vevo python=3.10
conda activate vevo
pip install -r requirements.txt
```

#### 不使用 Conda

```bash
# 直接使用 pip
pip install -r requirements.txt
```

#### 前端依赖

```bash
cd frontend
npm install
```

### 2. 检查环境

```bash
# 运行环境检查工具
check_env.cmd
```

### 3. 启动服务

#### 方式一：一键启动（推荐）

```bash
# 自动激活 vevo 环境并启动前后端
start.cmd
```

#### 方式二：分别启动

```bash
# 终端1：启动后端
start_backend.cmd

# 终端2：启动前端
start_frontend.cmd
```

#### 方式三：手动启动

```bash
# 终端1：启动后端
conda activate vevo
python backend/main.py

# 终端2：启动前端
cd frontend
npm run dev
```

### 4. 访问应用

打开浏览器访问：`http://localhost:5173`

## 🔮 配置 LLM 模型

### ⚠️ 安全提示

**重要：请妥善保管您的 API Key！**

- 切勿将真实 API Key 提交到版本控制
- 建议使用环境变量管理敏感信息
- 定期轮换 API Key
- 限制 API Key 的权限范围
- 不要在公开场合分享 API Key

---

### 方式一：通过界面配置（推荐）

1. 点击左侧 **"🔮 法阵管理"** 按钮
2. 填写模型信息：
   - **模型名称**：自定义名称（如"通义千问-Plus"）
   - **协议类型**：选择 OpenAI / 火山方舟 / 阿里百炼
   - **Model ID**：模型标识符（如 `qwen-plus`）
   - **Base URL**：API 地址（自动填充默认值）
   - **API Key**：你的 API 密钥
3. 点击 **"🧪 测试连接"** 验证配置
4. 点击 **"➕ 添加"** 保存配置

### 方式二：直接操作数据库

```sql
INSERT INTO llm_models (id, name, protocol, api_key, base_url, model_id, is_default) 
VALUES (
  'llm_test001',
  '通义千问-Plus',
  'bailian',
  'sk-your-api-key',
  'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'qwen-plus',
  1
);
```

## 📋 支持的协议

| 协议 | 标识符 | 默认 Base URL | 示例 Model ID |
|------|--------|---------------|---------------|
| **OpenAI** | `openai` | `https://api.openai.com/v1` | `gpt-4`, `gpt-3.5-turbo` |
| **火山方舟** | `volcano` | `https://ark.cn-beijing.volces.com/api/v3` | `ep-xxxxx` |
| **阿里百炼** | `bailian` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-turbo` |

## 🎯 使用流程

1. **创建卷宗**：输入小说名称，点击 "+" 创建新项目
2. **配置模型**：在"法阵管理"中添加并测试 LLM 模型
3. **选择模型**：在模型列表中点击"选择"按钮
4. **输入文本**：粘贴小说章节内容或点击"导入文本"上传 .txt 文件
5. **调整设置**：可选调整切片大小（默认 500 字）
6. **开始炼化**：点击"🔥 开始炼化"按钮进行分析
7. **查看图谱**：右侧自动渲染人物关系网络
8. **清理数据**：如有重复节点，点击"🧹 清理重复"按钮
9. **导出备份**：点击"📤 导出卷宗"保存数据

## 📊 数据库结构

```
storymap.db
├── projects      # 项目/卷宗表
├── nodes         # 人物节点表
├── edges         # 关系边表
└── llm_models    # LLM 模型配置表
```

## 🔧 API 接口

### 项目管理
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建新项目
- `GET /api/projects/{pid}/data` - 获取项目数据
- `POST /api/projects/{pid}/analyze` - 分析文本

### LLM 管理
- `GET /api/llm-models` - 获取所有模型
- `POST /api/llm-models` - 添加新模型
- `PUT /api/llm-models/{id}` - 更新模型
- `DELETE /api/llm-models/{id}` - 删除模型
- `POST /api/llm-models/test` - 测试模型连接

## 🛠️ 技术栈

- **后端**：FastAPI + SQLite + OpenAI SDK
- **前端**：React + Vite + Zustand
- **图形**：AntV G6 4.x
- **AI**：支持多种 LLM 协议

## 📝 注意事项

1. **API Key 安全**：请妥善保管 API Key，不要提交到版本控制
2. **模型测试**：添加模型前务必测试连接，避免推演失败
3. **文本长度**：系统会自动分块处理，默认每块 500 字（可调整）
4. **数据备份**：定期导出卷宗数据，避免数据丢失
5. **节点去重**：如发现重复节点，使用"清理重复"功能自动合并
6. **关系演变**：系统会自动合并同一对人物的关系演变（如：同学 → 恋人 → 夫妻）
7. **Debug 模式**：开启 Debug 可查看完整的 AI 交互日志，便于优化提示词

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 👨‍💻 作者

**你们喜爱的老王**

如有问题或建议，欢迎反馈！

## 📦 打包为 EXE

想要打包成独立的 Windows 可执行文件？

```bash
# 一键打包
build-exe.cmd
```

详细说明：
- [快速打包指南](快速打包指南.md) - 一键打包教程
- [打包为EXE指南](打包为EXE指南.md) - 完整打包方案

打包后用户无需安装 Python、Node.js 等环境，双击即可使用！

---

## 📚 文档

- [功能说明](功能说明.md) - 详细功能介绍
- [安装指南](安装指南.md) - 完整安装步骤
- [使用技巧](使用技巧.md) - 高效使用技巧
- [快速参考](快速参考.md) - 常用命令速查
- [项目结构](项目结构.md) - 代码结构说明
- [更新日志 v2.4](CHANGELOG-v2.4.md) - v2.4 版本详情
- [更新日志 v1.0](CHANGELOG-v1.0.md) - v1.0 版本详情
- [快速打包指南](快速打包指南.md) - EXE 打包教程

## 🔄 版本历史

- **v2.4** (2026-02-19) - 快速切换优化、数据完整性修复
- **v2.3** (2026-02-18) - 可调整布局
- **v2.2** (2026-02-17) - 布局优化
- **v2.1** (2026-02-16) - Bug 修复
- **v1.0** (2026-02-15) - 首次发布

## 📄 许可证

MIT License

---

**众生谱 v2.4 - 让人物关系一目了然** 🎉  
**作者：你们喜爱的老王**
