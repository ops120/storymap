/**
 * 众生谱 StoryMap v1.0
 * 基于大语言模型的叙事关系分析工具
 * 
 * 作者：你们喜爱的老王
 * 
 * 主应用组件
 */

import { useState, useEffect, useRef } from 'react';
import './App.css';
import GraphView from './GraphView';
import LLMManager from './LLMManager';
import ResizableLayout from './ResizableLayout';
import { useStore } from './store';
import { loadConfig, saveConfig } from './config';

export default function App() {
  const s = useStore();
  const [text, setText] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showLLMManager, setShowLLMManager] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [debug, setDebug] = useState(false);
  const [chunkSize, setChunkSize] = useState(500);
  const [systemPrompt, setSystemPrompt] = useState('');
  const fileInputRef = useRef(null);
  const textFileRef = useRef(null);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10000; // 每页显示1万字
  const totalPages = Math.ceil(text.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, text.length);
  const displayText = text.length > pageSize ? text.substring(startIndex, endIndex) : text;

  // 添加旋转动画
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // 加载配置
  useEffect(() => {
    const config = loadConfig();
    setDebug(config.debug);
    setChunkSize(config.defaultChunkSize);
    setSystemPrompt(config.systemPrompt);
  }, []);

  // 初始化数据
  useEffect(() => {
    s.fetchProjects();
    s.fetchLlmModels();
  }, []);

  // 保存配置
  const handleSaveConfig = () => {
    const config = {
      debug,
      defaultChunkSize: chunkSize,
      systemPrompt
    };
    saveConfig(config);
    alert('配置已保存');
  };

  // 重置配置
  const handleResetConfig = () => {
    if (confirm('确定要重置为默认配置吗？')) {
      localStorage.removeItem('storymap_config');
      const config = loadConfig();
      setDebug(config.debug);
      setChunkSize(config.defaultChunkSize);
      setSystemPrompt(config.systemPrompt);
      alert('配置已重置');
    }
  };

  return (
    <>
    <ResizableLayout
      left={
        <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>📚 卷宗管理</h3>

          {/* 项目列表 */}
          <div style={{ marginBottom: 16 }}>
            {s.projects.map(p => (
              <div
                key={p.id}
                style={{
                  padding: '8px 12px',
                  marginBottom: 8,
                  background: s.currentProjectId === p.id ? '#e6f7ff' : '#f5f5f5',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span onClick={() => s.selectProject(p.id)}>{p.name}</span>
                <div>
                  <button
                    onClick={() => {
                      const newName = prompt('输入新名称:', p.name);
                      if (newName && newName.trim()) {
                        s.renameProject(p.id, newName.trim());
                      }
                    }}
                    style={{ marginRight: 4, padding: '2px 6px', fontSize: 12 }}
                    title="重命名"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除卷宗"${p.name}"吗？`)) {
                        s.deleteProject(p.id);
                      }
                    }}
                    style={{ padding: '2px 6px', fontSize: 12 }}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 新建项目 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && newProjectName.trim()) {
                  s.createProject(newProjectName.trim());
                  setNewProjectName('');
                }
              }}
              placeholder="新建卷宗..."
              style={{ flex: 1, padding: 8 }}
            />
            <button
              onClick={() => {
                if (newProjectName.trim()) {
                  s.createProject(newProjectName.trim());
                  setNewProjectName('');
                }
              }}
              style={{ padding: '8px 16px' }}
            >
              +
            </button>
          </div>

          <hr style={{ margin: '16px 0' }} />

          {/* 功能按钮 */}
          <button
            onClick={() => setShowLLMManager(true)}
            style={{ width: '100%', padding: 12, marginBottom: 8 }}
          >
            🔮 法阵管理
          </button>

          <button
            onClick={() => setShowConfig(true)}
            style={{ width: '100%', padding: 12, marginBottom: 8 }}
          >
            ⚙️ 配置
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', padding: 12, marginBottom: 8 }}
          >
            📥 导入卷宗
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) s.importProject(file);
              e.target.value = '';
            }}
          />

          <button
            onClick={() => s.exportProject()}
            disabled={!s.currentProjectId}
            style={{ width: '100%', padding: 12, marginBottom: 8 }}
          >
            📤 导出卷宗
          </button>

          <button
            onClick={() => s.cleanupDuplicates(s.currentProjectId)}
            disabled={!s.currentProjectId}
            style={{ width: '100%', padding: 12 }}
          >
            🧹 清理重复
          </button>
        </div>
      }
      middle={
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>🔥 演化控制台</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={debug}
                onChange={e => {
                  setDebug(e.target.checked);
                  const config = loadConfig();
                  saveConfig({ ...config, debug: e.target.checked });
                }}
              />
              Debug
            </label>
          </div>

          {/* 当前项目 */}
          {s.currentProjectId && (
            <div style={{ 
              marginBottom: 12, 
              padding: 8, 
              background: s.isLoadingProject ? '#fff3cd' : '#f0f0f0', 
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {s.isLoadingProject && (
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #e0e0e0',
                  borderTop: '2px solid #667eea',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              )}
              <span>
                当前卷宗: {s.projects.find(p => p.id === s.currentProjectId)?.name}
                {s.isLoadingProject && ' (加载中...)'}
              </span>
              {/* 调试信息 */}
              {console.log('App.jsx: isLoadingProject =', s.isLoadingProject)}
            </div>
          )}

          {/* 切片大小 */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>切片大小:</label>
            <input
              type="number"
              value={chunkSize}
              onChange={e => {
                const val = parseInt(e.target.value);
                if (val >= 100 && val <= 5000) {
                  setChunkSize(val);
                  s.setChunkSize(val);
                }
              }}
              min="100"
              max="5000"
              step="100"
              style={{ width: 80, padding: 4 }}
            />
            <span>字</span>
          </div>

          {/* 当前模型 */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>当前法阵:</label>
            <select
              value={s.currentLlmId || ''}
              onChange={e => s.selectLlmModel(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            >
              <option value="">请选择模型</option>
              {s.llmModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.protocol})
                </option>
              ))}
            </select>
          </div>

          {/* 文本输入 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => textFileRef.current?.click()}
                  style={{ padding: '8px 16px' }}
                >
                  导入文本
                </button>
                <input
                  ref={textFileRef}
                  type="file"
                  accept=".txt"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const arrayBuffer = await file.arrayBuffer();
                        let content = '';
                        
                        try {
                          content = new TextDecoder('utf-8').decode(arrayBuffer);
                          if (content.includes('�')) throw new Error('UTF-8 failed');
                        } catch {
                          try {
                            content = new TextDecoder('gbk').decode(arrayBuffer);
                          } catch {
                            content = new TextDecoder('utf-16').decode(arrayBuffer);
                          }
                        }
                        
                        setText(content);
                        setCurrentPage(1); // 重置到第一页
                      } catch (error) {
                        alert('文件读取失败: ' + error.message);
                      }
                    }
                    e.target.value = '';
                  }}
                />
                {text.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('确定要清空文本吗？')) {
                        setText('');
                        setCurrentPage(1);
                      }
                    }}
                    style={{ padding: '8px 16px', background: '#ff4d4f', color: 'white' }}
                  >
                    清空
                  </button>
                )}
              </div>
              <div style={{ 
                fontSize: 13, 
                color: text.length > 100000 ? '#ff4d4f' : '#666',
                padding: '4px 12px',
                background: text.length > 100000 ? '#fff1f0' : '#f5f5f5',
                borderRadius: 4,
                fontWeight: text.length > 100000 ? 'bold' : 'normal'
              }}>
                总字数: {text.length.toLocaleString()}
                {text.length > 100000 && ' ⚠️'}
              </div>
            </div>
            
            {/* 分页控制 */}
            {text.length > pageSize && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#f0f0f0',
                borderRadius: 4,
                fontSize: 13
              }}>
                <div style={{ color: '#666' }}>
                  第 {currentPage} / {totalPages} 页 
                  （显示 {startIndex + 1} - {endIndex} 字）
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    首页
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    下一页
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    末页
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={e => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    style={{
                      width: 50,
                      padding: '4px',
                      fontSize: 12,
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* 大文本提示 */}
            {text.length > 100000 && (
              <div style={{
                padding: '8px 12px',
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: 4,
                fontSize: 13,
                color: '#d46b08'
              }}>
                💡 提示：文本较大（{Math.round(text.length / 10000) / 10}万字），已启用分页显示。
                每页显示 1 万字，可使用翻页按钮浏览。
              </div>
            )}
            
            <textarea
              value={displayText}
              onChange={e => {
                // 更新当前页的内容
                const newPageText = e.target.value;
                const before = text.substring(0, startIndex);
                const after = text.substring(endIndex);
                setText(before + newPageText + after);
              }}
              placeholder="粘贴小说片段，或点击【导入文本】上传 .txt 文件...

提示：
- 支持大文本（已测试100万字）
- 超过1万字自动分页显示
- 可使用翻页按钮浏览全文
- 完整文本将用于分析"
              style={{
                flex: 1,
                padding: 12,
                fontSize: 14,
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* 进度显示 */}
          {s.isAnalyzing && (
            <div style={{ marginTop: 12, padding: 8, background: '#fff3cd', borderRadius: 4 }}>
              正在炼化中... {s.progress}%
              {text.length > 100000 && (
                <div style={{ fontSize: 12, marginTop: 4, color: '#856404' }}>
                  大文本处理中，预计需要 {Math.ceil(text.length / chunkSize / 2)} 分钟
                </div>
              )}
            </div>
          )}

          {/* 开始分析按钮 */}
          <button
            onClick={async () => {
              console.log('=== 点击炼化按钮 ===');
              console.log('当前项目ID:', s.currentProjectId);
              console.log('当前模型ID:', s.currentLlmId);
              console.log('文本内容:', text.substring(0, 100));
              console.log('文本长度:', text.length);
              
              if (!s.currentProjectId) {
                alert('请先选择或创建一个卷宗');
                return;
              }
              if (!s.currentLlmId) {
                alert('请先选择一个 LLM 模型');
                return;
              }
              if (!text.trim()) {
                alert('请输入要分析的文本');
                return;
              }

              // 大文本警告
              if (text.length > 100000) {
                const chunks = Math.ceil(text.length / chunkSize);
                const estimatedTime = Math.ceil(chunks / 2); // 假设每秒处理2个切片
                const confirmed = confirm(
                  `文本较大（${text.length.toLocaleString()} 字），将分为 ${chunks} 个切片处理。\n\n` +
                  `预计耗时：${estimatedTime} 分钟\n` +
                  `建议：可以先用小段文本测试\n\n` +
                  `确定要继续吗？`
                );
                if (!confirmed) return;
              }

              if (debug) {
                console.log('=== Debug 模式 ===');
                console.log('当前模型:', s.llmModels.find(m => m.id === s.currentLlmId));
                console.log('系统提示词:', systemPrompt);
                console.log('切片大小:', chunkSize);
              }

              console.log('开始调用 analyzeText...');
              try {
                await s.analyzeText(text);
                console.log('analyzeText 调用完成');
                setText('');
              } catch (error) {
                console.error('analyzeText 调用失败:', error);
                alert('分析失败: ' + error.message);
              }
            }}
            disabled={s.isAnalyzing || !s.currentProjectId || !s.currentLlmId}
            style={{
              marginTop: 12,
              padding: 16,
              fontSize: 16,
              fontWeight: 'bold',
              background: s.isAnalyzing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: s.isAnalyzing ? 'not-allowed' : 'pointer'
            }}
          >
            {s.isAnalyzing ? '炼化中...' : `🔥 开始炼化${text.length > 0 ? ` (${Math.ceil(text.length / chunkSize)} 个切片)` : ''}`}
          </button>
        </div>
      }
      right={
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0 }}>🕸️ 关系图谱投影</h3>
            {s.currentProjectId && (
              <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
                节点: {s.nodes.length} | 关系: {s.edges.length}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <GraphView nodes={s.nodes} edges={s.edges} />
          </div>
        </div>
      }
    />

    {/* LLM 管理弹窗 */}
    {showLLMManager && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowLLMManager(false)}
      >
        <div onClick={e => e.stopPropagation()}>
          <LLMManager onClose={() => setShowLLMManager(false)} />
        </div>
      </div>
    )}

    {/* 配置弹窗 */}
    {showConfig && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowConfig(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: 8,
            padding: 24,
            width: '80%',
            maxWidth: 800,
            maxHeight: '80vh',
            overflow: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>⚙️ 配置</h2>
            <button onClick={() => setShowConfig(false)} style={{ fontSize: 20, padding: '4px 12px' }}>×</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>系统提示词</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              style={{ width: '100%', minHeight: 200, padding: 8, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={debug}
                onChange={e => setDebug(e.target.checked)}
              />
              <span>Debug 模式</span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>默认切片大小</label>
            <input
              type="number"
              value={chunkSize}
              onChange={e => {
                const val = parseInt(e.target.value);
                if (val >= 100 && val <= 5000) {
                  setChunkSize(val);
                }
              }}
              min="100"
              max="5000"
              step="100"
              style={{ width: 120, padding: 8 }}
            />
            <span style={{ marginLeft: 8 }}>字 (100-5000)</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSaveConfig} style={{ padding: '8px 16px' }}>💾 保存配置</button>
            <button onClick={handleResetConfig} style={{ padding: '8px 16px' }}>🔄 重置默认</button>
          </div>
        </div>
      </div>
    )}

    {/* 作者信息 */}
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '10px 20px',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
      zIndex: 999,
      border: '2px solid rgba(255, 255, 255, 0.3)',
      cursor: 'default',
      userSelect: 'none'
    }}>
      ✨ 作者：你们喜爱的老王
    </div>
  </>
  );
}
