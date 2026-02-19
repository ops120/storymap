// Electron 预加载脚本
// 在渲染进程加载前执行，可以安全地暴露 Node.js API

window.addEventListener('DOMContentLoaded', () => {
  console.log('众生谱 Electron 应用已加载');
  
  // 可以在这里添加一些初始化逻辑
  // 例如：版本信息、环境检测等
  
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  // 显示版本信息（如果页面有对应元素）
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

// 如果需要暴露特定的 API 给渲染进程，可以使用 contextBridge
// const { contextBridge } = require('electron');
// contextBridge.exposeInMainWorld('electronAPI', {
//   // 在这里定义需要暴露的 API
// });
