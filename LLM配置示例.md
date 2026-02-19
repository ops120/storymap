# LLM 模型配置示例

## 🔮 阿里百炼（通义千问）

### 获取 API Key
1. 访问：https://dashscope.aliyun.com/
2. 登录阿里云账号
3. 进入"API-KEY 管理"
4. 创建新的 API Key

### 配置信息
```
模型名称: 通义千问-Plus
协议类型: bailian
Model ID: qwen-plus
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 可用模型
- `qwen-plus` - 通义千问 Plus（推荐）
- `qwen-turbo` - 通义千问 Turbo（快速）
- `qwen-max` - 通义千问 Max（最强）
- `qwen-long` - 通义千问 Long（长文本）

---

## 🌋 火山方舟（字节跳动）

### 获取 API Key
1. 访问：https://console.volcengine.com/ark
2. 登录火山引擎账号
3. 创建推理接入点
4. 获取 API Key 和 Endpoint ID

### 配置信息
```
模型名称: 豆包-Pro
协议类型: volcano
Model ID: ep-20240611xxxxxx-xxxxx
Base URL: https://ark.cn-beijing.volces.com/api/v3
API Key: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 注意事项
- Model ID 格式为 `ep-` 开头的 Endpoint ID
- 需要在火山引擎控制台创建推理接入点
- 支持豆包系列、Llama、Mistral 等多种模型

---

## 🤖 OpenAI

### 获取 API Key
1. 访问：https://platform.openai.com/
2. 登录 OpenAI 账号
3. 进入"API Keys"页面
4. 创建新的 API Key

### 配置信息
```
模型名称: GPT-4
协议类型: openai
Model ID: gpt-4
Base URL: https://api.openai.com/v1
API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 可用模型
- `gpt-4` - GPT-4（最强）
- `gpt-4-turbo` - GPT-4 Turbo（快速）
- `gpt-3.5-turbo` - GPT-3.5 Turbo（经济）

### 使用代理
如果使用第三方代理服务，修改 Base URL：
```
Base URL: https://your-proxy.com/v1
```

---

## 🧪 测试连接

配置完成后，务必点击"🧪 测试连接"按钮验证：

### 成功示例
```
✅ 连接成功 - 响应: 测试成功
```

### 失败示例
```
❌ Error: Invalid API Key
❌ Error: Connection timeout
❌ Error: Model not found
```

---

## 💡 最佳实践

### 1. 多模型配置
建议配置多个模型，根据场景切换：
- **快速模型**：用于测试和快速迭代（qwen-turbo）
- **标准模型**：日常使用（qwen-plus）
- **高级模型**：复杂场景（qwen-max, gpt-4）

### 2. 设置默认模型
勾选"设为默认模型"，新建项目时自动使用该配置。

### 3. Base URL 自定义
- 使用代理服务时修改 Base URL
- 企业内网部署时指向内网地址
- 支持自定义端口：`http://localhost:8080/v1`

### 4. API Key 安全
- 不要在代码中硬编码 API Key
- 定期轮换 API Key
- 使用环境变量或配置文件管理

---

## 🔍 常见问题

### Q: 测试连接失败怎么办？
A: 检查以下几点：
1. API Key 是否正确
2. Base URL 是否可访问
3. Model ID 是否存在
4. 网络是否正常

### Q: 支持哪些模型？
A: 理论上支持所有兼容 OpenAI 协议的模型，包括：
- OpenAI 官方模型
- 阿里通义千问系列
- 字节豆包系列
- 智谱 GLM 系列（需自定义 Base URL）
- Moonshot（需自定义 Base URL）

### Q: 如何切换模型？
A: 在"法阵管理"中点击模型的"选择"按钮即可切换。

### Q: 可以同时使用多个模型吗？
A: 可以配置多个模型，但每次推演只使用当前选中的模型。

---

## 📞 获取帮助

如遇问题，请检查：
1. 后端日志：查看终端输出
2. 前端控制台：按 F12 查看浏览器控制台
3. 数据库：使用 SQLite 工具查看 `storymap.db`
