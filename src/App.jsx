import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Space, Button, Card, Modal, Input, 
  Select, message, Upload, Empty, Tag, List, Divider, 
  Badge, Drawer, Progress 
} from 'antd';
import { 
  DeploymentUnitOutlined, TableOutlined, DownloadOutlined, 
  UploadOutlined, BulbOutlined, SettingOutlined, FolderOpenOutlined, 
  PlusOutlined, FileTextOutlined, DeleteOutlined, HistoryOutlined,
  CloseCircleOutlined, ExportOutlined 
} from '@ant-design/icons';

// ⚠️ 必须确保这两个组件内部有 export default
import GraphView from './components/GraphView';
import TableView from './components/TableView'; 
import { useRelationStore } from './store/useRelationStore';
import { useTaskStore } from './store/useTaskStore';

const { Header, Content, Sider } = Layout;
const { Title, Text, TextArea } = Input;

export default function App() {
  const store = useRelationStore();
  const taskStore = useTaskStore();
  
  const [viewMode, setViewMode] = useState('graph');
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isNewProjOpen, setIsNewProjOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  
  const [newProjName, setNewProjName] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedModelIdx, setSelectedModelIdx] = useState(0);

  const [models, setModels] = useState(() => {
    const saved = localStorage.getItem('sm_logic_arrays');
    return saved ? JSON.parse(saved) : [
      { provider: 'aliyun', apiKey: '', model: 'qwen-max', name: '默认阿里', baseUrl: '' },
      { provider: 'volcano', apiKey: '', model: '', name: '火山豆包', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3' }
    ];
  });

  useEffect(() => { 
    store.init(); 
    taskStore.loadTasks();
    window.useRelationStore = useRelationStore; 
  }, []);

  const saveModels = (m) => { setModels(m); localStorage.setItem('sm_logic_arrays', JSON.stringify(m)); };

  const handleAIRun = () => {
    const model = models[selectedModelIdx];
    if (!model?.apiKey || !inputText) return message.warning('请检查配置和文本');
    taskStore.createTask(store.currentProjectId, model, inputText);
    setIsAnalyzeOpen(false); 
    setInputText('');
    setIsTaskDrawerOpen(true);
  };

  const handleImport = ({ file }) => {
    if (!store.currentProjectId) return message.error('请先选择秘档');
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const cleanContent = e.target.result.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
        const data = JSON.parse(cleanContent);
        await store.setGraphData(data.nodes || [], data.edges || []);
        message.success('导入成功');
      } catch (err) { message.error('JSON格式非法'); }
    };
    reader.readAsText(file);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Title level={4} style={{ color: '#1890ff', margin: 0 }}>众生谱 · 秘档</Title>
        </div>
        <div style={{ padding: '0 16px' }}>
          {/* 修复 block 警告：不写 ={true} */}
          <Button block type="dashed" icon={<PlusOutlined />} onClick={() => setIsNewProjOpen(true)}>开启新秘档</Button>
          <Divider style={{ margin: '12px 0' }} />
          {store.projects?.map(p => (
            <div key={p.id} onClick={() => store.switchProject(p.id)} style={{
              padding: '12px', margin: '4px 0', borderRadius: '8px', cursor: 'pointer',
              background: store.currentProjectId === p.id ? '#e6f7ff' : 'transparent',
              color: store.currentProjectId === p.id ? '#1890ff' : '#666',
            }}>
              <FolderOpenOutlined style={{ marginRight: 8 }} /> {p.name}
            </div>
          ))}
        </div>
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
          <Space.Compact>
            <Button type={viewMode === 'graph' ? 'primary' : 'default'} onClick={() => setViewMode('graph')} icon={<DeploymentUnitOutlined />}>图谱</Button>
            <Button type={viewMode === 'table' ? 'primary' : 'default'} onClick={() => setViewMode('table')} icon={<TableOutlined />}>列表</Button>
          </Space.Compact>
          
          <Space>
            <Badge count={taskStore.activeTasks?.filter(t => t.status === 'running').length || 0}>
              <Button icon={<HistoryOutlined />} onClick={() => setIsTaskDrawerOpen(true)}>监控</Button>
            </Badge>
            <Upload accept=".json" customRequest={handleImport} showUploadList={false}><Button icon={<UploadOutlined />}>导入</Button></Upload>
            <Button icon={<DownloadOutlined />} onClick={() => {
              const data = JSON.stringify({ nodes: store.nodes, edges: store.edges }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `备份_${Date.now()}.json`; a.click();
            }}>导出</Button>
            <Button icon={<SettingOutlined />} onClick={() => setIsSettingOpen(true)}>法阵</Button>
            <Button type="primary" icon={<BulbOutlined />} onClick={() => setIsAnalyzeOpen(true)}>智能解析</Button>
          </Space>
        </Header>

        <Content style={{ padding: '24px' }}>
          {store.currentProjectId ? (
            <Card style={{ borderRadius: 12, minHeight: 'calc(100vh - 150px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              {/* 渲染防护：如果是 undefined 则显示 Empty 而非崩溃 */}
              {viewMode === 'graph' ? (
                GraphView ? <GraphView /> : <Empty description="GraphView 组件未定义" />
              ) : (
                TableView ? <TableView /> : <Empty description="TableView 组件未定义" />
              )}
            </Card>
          ) : <Empty description="请从左侧选择秘档" style={{ marginTop: 150 }} />}
        </Content>
      </Layout>

      {/* 弹窗：演化法阵配置 */}
      <Modal title="演化法阵管理" open={isSettingOpen} onCancel={() => setIsSettingOpen(false)} footer={null} width={650}>
        <List
          dataSource={models}
          renderItem={(item, index) => (
            <List.Item actions={[<Button danger size="small" onClick={() => saveModels(models.filter((_, i) => i !== index))}>移除</Button>]}>
              <div style={{ width: '100%' }}>
                <Input value={item.name} placeholder="法阵名称" style={{ marginBottom: 8 }} onChange={e => {
                  const next = [...models]; next[index].name = e.target.value; saveModels(next);
                }} />
                <Space style={{ display: 'flex', marginBottom: 8 }}>
                  <Select value={item.provider} style={{ width: 120 }} onChange={v => {
                    const next = [...models]; next[index].provider = v; saveModels(next);
                  }} options={[{value:'aliyun', label:'阿里'}, {value:'volcano', label:'火山'}, {value:'openai', label:'OpenAI'}]} />
                  <Input.Password placeholder="API Key" value={item.apiKey} style={{ flex: 1 }} onChange={e => {
                    const next = [...models]; next[index].apiKey = e.target.value; saveModels(next);
                  }} />
                </Space>
                <Input prefix="BaseURL:" value={item.baseUrl} placeholder="接口地址" onChange={e => {
                  const next = [...models]; next[index].baseUrl = e.target.value; saveModels(next);
                }} />
              </div>
            </List.Item>
          )}
        />
        <Button block type="dashed" icon={<PlusOutlined />} onClick={() => saveModels([...models, { name: '新法阵', provider: 'aliyun', apiKey: '', model: '', baseUrl: '' }])}>添加配置</Button>
      </Modal>

      {/* 弹窗：任务监控 */}
      <Drawer 
        title="监控中心" 
        open={isTaskDrawerOpen} 
        onClose={() => setIsTaskDrawerOpen(false)} 
        size="large"
        extra={<Button icon={<ExportOutlined />} onClick={() => taskStore.exportLogs()}>日志</Button>}
      >
        <List
          dataSource={taskStore.activeTasks || []}
          renderItem={item => (
            <Card size="small" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>{item.modelName}</Text>
                <Space>
                  {item.status === 'running' && <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => taskStore.cancelTask(item.id)}>终止</Button>}
                  <Tag color={item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'blue'}>{item.status}</Tag>
                </Space>
              </div>
              <Progress percent={item.progress} status={item.status === 'failed' ? 'exception' : 'active'} />
            </Card>
          )}
        />
      </Drawer>

      <Modal title="智能解析" open={isAnalyzeOpen} onOk={handleAIRun} onCancel={() => setIsAnalyzeOpen(false)} width={700}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 修复 block 属性 */}
          <Select value={selectedModelIdx} onChange={setSelectedModelIdx} options={models.map((m, i) => ({ value: i, label: m.name }))} />
          <Upload beforeUpload={(f) => {
            const r = new FileReader(); r.onload = (e) => setInputText(e.target.result); r.readAsText(f); return false;
          }} showUploadList={false}><Button icon={<FileTextOutlined />}>载入本地 TXT 卷轴</Button></Upload>
          <TextArea rows={12} value={inputText} onChange={e => setInputText(e.target.value)} placeholder="粘贴文本..." />
        </div>
      </Modal>

      <Modal title="新秘档" open={isNewProjOpen} onOk={() => { store.createProject(newProjName); setIsNewProjOpen(false); setNewProjName(''); }} onCancel={() => setIsNewProjOpen(false)}>
        <Input placeholder="输入名字" value={newProjName} onChange={e => setNewProjName(e.target.value)} />
      </Modal>
    </Layout>
  );
}