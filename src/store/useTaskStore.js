import { create } from 'zustand';
import { db, logger } from '../db/database';
import { analyzeRelations } from '../services/llm';

export const useTaskStore = create((set, get) => ({
  activeTasks: [],
  logs: [],
  abortControllers: new Map(),

  loadTasks: async () => {
    const tasks = await db.tasks.orderBy('createdAt').reverse().toArray() || [];
    const logs = await db.logs.orderBy('id').reverse().limit(50).toArray() || [];
    set({ activeTasks: tasks, logs });
  },

  exportLogs: async () => {
    const allLogs = await db.logs.toArray();
    const content = allLogs.map(l => `[${l.timestamp}] ${l.level}: ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `推演日志_${Date.now()}.txt`;
    a.click();
  },

  cancelTask: async (taskId) => {
    const controller = get().abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      get().abortControllers.delete(taskId);
    }
    await db.tasks.update(taskId, { status: 'failed', message: '用户手动终止', progress: 100 });
    await logger.log('WARN', `强杀任务: ${taskId}`);
    get().loadTasks();
  },

  createTask: async (projectId, modelConfig, text) => {
    if (!projectId) return;
    const taskId = `task_${Date.now()}`;
    const controller = new AbortController();
    get().abortControllers.set(taskId, controller);

    await db.tasks.add({ id: taskId, projectId, status: 'running', progress: 10, modelName: modelConfig.name, createdAt: new Date() });
    await get().loadTasks();

    (async () => {
      try {
        const result = await analyzeRelations(
          modelConfig.provider, modelConfig.apiKey, modelConfig.model, 
          text, modelConfig.baseUrl, controller.signal
        );
        const rStore = window.useRelationStore?.getState();
        if (rStore) await rStore.setGraphData(result.nodes, result.edges);
        await db.tasks.update(taskId, { status: 'completed', progress: 100 });
      } catch (err) {
        const isAbort = err.name === 'AbortError';
        await db.tasks.update(taskId, { status: 'failed', message: isAbort ? '已终止' : err.message });
      } finally {
        get().abortControllers.delete(taskId);
        get().loadTasks();
      }
    })();
  }
}));