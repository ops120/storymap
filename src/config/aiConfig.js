export const AI_SYSTEM_CONFIG = {
  debug: true,          // 开启后在控制台打印详细执行日志
  timeout: 60000,       // AI 响应硬超时设置 (1分钟)
  maxLogStorage: 500,   // 本地日志最大保留条数
  // 演化指令集
  systemPrompt: `你是一个文学分析专家。请严格以 JSON 格式提取人物关系。`
};