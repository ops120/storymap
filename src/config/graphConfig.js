export const RELATION_THEMES = {
  FRIEND: { color: '#52c41a', label: '好友', lineDash: null },
  ENEMY:  { color: '#f5222d', label: '死敌', lineDash: [5, 5] },
  COUPLE: { color: '#eb2f96', label: '道侣', lineDash: null },
  MASTER: { color: '#1890ff', label: '师徒', lineDash: null },
  NORMAL: { color: '#d9d9d9', label: '认识', lineDash: null }
};

export const SECT_COLORS = {
  '青云门': '#1890ff',
  '掩月宗': '#eb2f96',
  '七玄门': '#fa8c16',
  '乱星海': '#722ed1',
  '未知': '#bfbfbf'
};

export const G6_BASE_CONFIG = {
  autoResize: true,
  animation: false, // 彻底关闭初始动画以消除闪烁
  layout: {
    type: 'force',
    preventOverlap: true,
    linkDistance: 180,
    nodeStrength: -400,
    animated: false,  // 关闭力导向过程动画
    iterations: 200,  // 一次性完成布局计算
  },
  behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
};