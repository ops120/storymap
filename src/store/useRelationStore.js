import { create } from 'zustand';
import { db } from '../db/database';

export const useRelationStore = create((set, get) => ({
  projects: [],
  currentProjectId: null,
  nodes: [],
  edges: [],

  // 初始化加载所有卷宗
  init: async () => {
    const projects = await db.projects.toArray();
    set({ projects });
    if (projects.length > 0) get().switchProject(projects[0].id);
  },

  // 切换卷宗并加载对应数据
  switchProject: async (id) => {
    const nodes = await db.nodes.where('projectId').equals(id).toArray();
    const edges = await db.edges.where('projectId').equals(id).toArray();
    set({ currentProjectId: id, nodes, edges });
  },

  // 新建卷宗
  createProject: async (name) => {
    const id = Date.now().toString();
    await db.projects.add({ id, name, createdAt: new Date() });
    const projects = await db.projects.toArray();
    set({ projects });
    get().switchProject(id);
  },

  // 保存数据到当前卷宗
  setGraphData: async (nodes, edges) => {
    const pid = get().currentProjectId;
    if (!pid) return;
    await db.nodes.where('projectId').equals(pid).delete();
    await db.edges.where('projectId').equals(pid).delete();
    
    const nodesWithPid = nodes.map(n => ({ ...n, projectId: pid }));
    const edgesWithPid = edges.map(e => ({ ...e, projectId: pid }));
    
    await db.nodes.bulkAdd(nodesWithPid);
    await db.edges.bulkAdd(edgesWithPid);
    set({ nodes: nodesWithPid, edges: edgesWithPid });
  }
}));