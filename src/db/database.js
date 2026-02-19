import Dexie from 'dexie';

export const db = new Dexie('StoryMapDB');
db.version(3).stores({
  projects: 'id, name, createdAt',
  nodes: 'id, label, sect, projectId', 
  edges: '++id, source, target, type, projectId',
  // 新增：任务表 (status: pending, running, completed, failed)
  tasks: 'id, projectId, status, progress, modelName, createdAt',
  // 新增：日志表
  logs: '++id, timestamp, level, message, taskId'
});

// 日志助手函数
export const logger = {
  log: async (level, message, taskId = null) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      taskId
    };
    if (AI_SYSTEM_CONFIG.debug) {
      console.log(`[${logEntry.level}] ${logEntry.message}`, logEntry);
    }
    await db.logs.add(logEntry);
  }
};