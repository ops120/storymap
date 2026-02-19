import React from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { useRelationStore } from '../store/useRelationStore';
import { RELATION_THEMES } from '../config/graphConfig';

const TableView = () => {
  const { edges, removeEdge } = useRelationStore();

  const columns = [
    { title: '人物 A', dataIndex: 'source', key: 'source', render: (id, record) => <b>{id === '1' ? '韩立' : id}</b> }, // 演示用，实际可关联Node Label
    { 
      title: '关系类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type, record) => (
        <Tag color={RELATION_THEMES[type]?.color}>{record.label}</Tag>
      )
    },
    { title: '人物 B', dataIndex: 'target', key: 'target' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" danger onClick={() => removeEdge(record.source, record.target)}>删除</Button>
      ),
    },
  ];

  return <Table dataSource={edges} columns={columns} rowKey={r => `${r.source}-${r.target}`} pagination={false} />;
};

export default TableView;