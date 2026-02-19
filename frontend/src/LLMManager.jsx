import React, { useState } from 'react';
import { useStore } from './store';

const PROTOCOLS = [
  { value: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
  { value: 'volcano', label: '火山方舟', defaultUrl: 'https://ark.cn-beijing.volces.com/api/v3' },
  { value: 'bailian', label: '阿里百炼', defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' }
];

export default function LLMManager({ onClose }) {
  const s = useStore();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'openai',
    api_key: '',
    base_url: 'https://api.openai.com/v1',
    model_id: '',
    is_default: false
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleProtocolChange = (protocol) => {
    const p = PROTOCOLS.find(x => x.value === protocol);
    setFormData({ ...formData, protocol, base_url: p?.defaultUrl || '' });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await s.testLlmModel({
      api_key: formData.api_key,
      base_url: formData.base_url,
      model_id: formData.model_id,
      protocol: formData.protocol
    });
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.api_key || !formData.model_id) {
      alert('请填写完整信息');
      return;
    }

    if (editingId) {
      await s.updateLlmModel(editingId, formData);
    } else {
      await s.addLlmModel(formData);
    }

    resetForm();
  };

  const handleEdit = (model) => {
    setEditingId(model.id);
    setFormData({
      name: model.name,
      protocol: model.protocol,
      api_key: model.api_key,
      base_url: model.base_url,
      model_id: model.model_id,
      is_default: model.is_default === 1
    });
    setTestResult(null);
  };

  const handleDelete = async (id) => {
    if (confirm('确定删除此模型配置？')) {
      await s.deleteLlmModel(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      protocol: 'openai',
      api_key: '',
      base_url: 'https://api.openai.com/v1',
      model_id: '',
      is_default: false
    });
    setTestResult(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 1000, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* 标题栏 */}
        <div style={{ 
          padding: '20px 30px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>🔮 演化法阵管理</h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: '#fff',
              fontSize: 24, 
              cursor: 'pointer',
              width: 32,
              height: 32,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            ×
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: 30, maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
          {/* 表单区 */}
          <div style={{ background: '#f8f9fa', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #e8e8e8' }}>
            <h4 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, fontWeight: 600, color: '#333' }}>
              {editingId ? '✏️ 编辑模型' : '➕ 添加新模型'}
            </h4>
            <div style={{ display: 'grid', gap: 16 }}>
              <input 
                placeholder="模型名称（如：通义千问-Plus）" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                style={inputStyle}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select 
                  value={formData.protocol}
                  onChange={e => handleProtocolChange(e.target.value)}
                  style={inputStyle}
                >
                  {PROTOCOLS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                
                <input 
                  placeholder="Model ID（如：qwen-plus）" 
                  value={formData.model_id}
                  onChange={e => setFormData({...formData, model_id: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <input 
                placeholder="Base URL" 
                value={formData.base_url}
                onChange={e => setFormData({...formData, base_url: e.target.value})}
                style={inputStyle}
              />

              <input 
                type="password"
                placeholder="API Key" 
                value={formData.api_key}
                onChange={e => setFormData({...formData, api_key: e.target.value})}
                style={inputStyle}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#666', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={e => setFormData({...formData, is_default: e.target.checked})}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                设为默认模型
              </label>

              {testResult && (
                <div style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  background: testResult.status === 'success' ? '#f6ffed' : '#fff2f0',
                  border: `1px solid ${testResult.status === 'success' ? '#b7eb8f' : '#ffccc7'}`,
                  color: testResult.status === 'success' ? '#52c41a' : '#ff4d4f',
                  fontSize: 13
                }}>
                  {testResult.status === 'success' ? (
                    <>✅ {testResult.message} - 响应: {testResult.response}</>
                  ) : (
                    <>❌ {testResult.message}</>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={handleTest} 
                  disabled={testing || !formData.api_key || !formData.model_id}
                  style={{
                    ...actionButtonStyle,
                    flex: 1,
                    background: '#1890ff',
                    opacity: (testing || !formData.api_key || !formData.model_id) ? 0.5 : 1
                  }}
                >
                  {testing ? '测试中...' : '🧪 测试连接'}
                </button>
                <button 
                  onClick={handleSave}
                  style={{
                    ...actionButtonStyle,
                    flex: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  {editingId ? '💾 更新' : '➕ 添加'}
                </button>
                {editingId && (
                  <button 
                    onClick={resetForm}
                    style={{
                      ...actionButtonStyle,
                      background: '#999'
                    }}
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 模型列表 */}
          <div>
            <h4 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600, color: '#333' }}>
              已配置的模型
            </h4>
            {s.llmModels.length === 0 ? (
              <div style={{ 
                padding: 40, 
                textAlign: 'center', 
                color: '#999',
                background: '#fafafa',
                borderRadius: 12,
                border: '2px dashed #e8e8e8'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
                <div style={{ fontSize: 14 }}>暂无模型配置，请添加第一个模型</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {s.llmModels.map(m => (
                  <div 
                    key={m.id} 
                    style={{ 
                      border: '1px solid #e8e8e8',
                      borderRadius: 12, 
                      padding: 20,
                      background: m.is_default ? 'linear-gradient(135deg, #f0f5ff 0%, #f9f0ff 100%)' : '#fff',
                      position: 'relative',
                      transition: 'all 0.3s',
                      boxShadow: s.currentLlmId === m.id ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none',
                      borderColor: s.currentLlmId === m.id ? '#667eea' : '#e8e8e8'
                    }}
                  >
                    {m.is_default && (
                      <span style={{ 
                        position: 'absolute', 
                        top: 12, 
                        right: 12, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff', 
                        padding: '4px 12px', 
                        borderRadius: 12, 
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        默认
                      </span>
                    )}
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ fontSize: 16, color: '#333' }}>{m.name}</strong>
                      <span style={{ marginLeft: 12, color: '#999', fontSize: 13 }}>
                        {PROTOCOLS.find(p => p.value === m.protocol)?.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
                      <div>Model: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{m.model_id}</code></div>
                      <div style={{ marginTop: 4 }}>URL: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{m.base_url}</code></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => s.selectLlmModel(m.id)}
                        disabled={s.currentLlmId === m.id}
                        style={{ 
                          padding: '8px 16px', 
                          background: s.currentLlmId === m.id ? '#52c41a' : '#667eea',
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 6, 
                          cursor: s.currentLlmId === m.id ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          transition: 'all 0.3s'
                        }}
                      >
                        {s.currentLlmId === m.id ? '✓ 已选择' : '选择'}
                      </button>
                      <button 
                        onClick={() => handleEdit(m)}
                        style={modelActionButtonStyle('#faad14')}
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        style={modelActionButtonStyle('#ff4d4f')}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 样式定义
const inputStyle = {
  padding: '10px 14px',
  border: '1px solid #d9d9d9',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.3s',
  fontFamily: 'inherit'
};

const actionButtonStyle = {
  padding: '12px 20px',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.3s'
};

const modelActionButtonStyle = (color) => ({
  padding: '8px 16px',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  transition: 'all 0.3s'
});
