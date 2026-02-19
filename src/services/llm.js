const SYSTEM_PROMPT = `你是一个文学分析专家。请严格返回 JSON 格式数据。
结构必须符合：{"nodes": [{"id": "...", "label": "...", "sect": "..."}], "edges": [...]}`;

export const analyzeRelations = async (provider, apiKey, model, text, baseUrl, signal) => {
  const defaultUrls = {
    openai: 'https://api.openai.com/v1',
    aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    volcano: 'https://ark.cn-beijing.volces.com/api/v3'
  };
  
  const finalUrl = baseUrl || defaultUrls[provider];

  const response = await fetch(`${finalUrl}/chat/completions`, {
    method: 'POST',
    signal, // ⚠️ 核心修复：接收并绑定中断信号
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      response_format: { type: "json_object" } // 强制 JSON 输出
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const raw = await response.json();
  const content = raw.choices[0].message.content;
  
  // 清洗可能存在的 Markdown 标签
  const cleanJson = content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
};