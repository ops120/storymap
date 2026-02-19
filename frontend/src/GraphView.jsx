import React, { useEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';
import { useStore } from './store';

export default function GraphView({ nodes, edges }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);
  const isLoadingProject = useStore(state => state.isLoadingProject);

  // 调试：监控 isLoadingProject 状态变化
  useEffect(() => {
    console.log('GraphView: isLoadingProject =', isLoadingProject);
  }, [isLoadingProject]);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('GraphView 数据更新:', { 
      nodeCount: nodes.length, 
      edgeCount: edges.length,
      nodes: nodes.slice(0, 3),
      edges: edges.slice(0, 3)
    });

    // 如果没有数据，显示提示
    if (nodes.length === 0) {
      console.log('没有节点数据');
      if (graphRef.current) {
        graphRef.current.clear();
      }
      return;
    }

    setIsRendering(true);

    // 使用 requestAnimationFrame 延迟渲染，避免阻塞 UI
    requestAnimationFrame(() => {
      try {
        // 数据验证：创建节点 ID 集合
        const nodeIds = new Set(nodes.map(n => String(n.id)));
        
        // 过滤掉无效的边（source 或 target 不存在）
        const validEdges = edges.filter(e => {
          const sourceExists = nodeIds.has(String(e.source));
          const targetExists = nodeIds.has(String(e.target));
          
          if (!sourceExists || !targetExists) {
            console.warn('⚠️ 发现无效边:', {
              edge: e,
              sourceExists,
              targetExists,
              source: e.source,
              target: e.target
            });
            return false;
          }
          return true;
        });
        
        if (validEdges.length < edges.length) {
          console.log(`✓ 已过滤 ${edges.length - validEdges.length} 条无效边`);
        }
        
        // 格式化数据 - G6 4.x 格式
        const graphData = {
          nodes: nodes.map(n => ({
            id: String(n.id),
            label: n.label,
            style: {
              fill: '#e6f7ff',
              stroke: '#1890ff',
              lineWidth: 2,
            },
            labelCfg: {
              style: {
                fill: '#000',
                fontSize: 14,
              }
            }
          })),
          edges: validEdges.map(e => {
            // 处理复合关系显示
            const isComplex = e.label && e.label.includes(' → ');
            return {
              source: String(e.source),
              target: String(e.target),
              label: e.label,
              style: {
                stroke: isComplex ? '#ff6b6b' : '#999',
                lineWidth: isComplex ? 3 : 2,
                endArrow: {
                  path: 'M 0,0 L 8,4 L 8,-4 Z',
                  fill: isComplex ? '#ff6b6b' : '#999',
                },
              },
              labelCfg: {
                autoRotate: true,
                style: {
                  fill: isComplex ? '#c92a2a' : '#666',
                  fontSize: isComplex ? 13 : 12,
                  fontWeight: isComplex ? 'bold' : 'normal',
                  background: {
                    fill: '#fff',
                    padding: [2, 4, 2, 4],
                    radius: 2,
                  }
                }
              }
            };
          })
        };

        console.log('格式化后的数据:', graphData);

        // 如果实例不存在，创建实例
        if (!graphRef.current) {
          console.log('创建新的 Graph 实例');
          
          // 根据节点数量选择布局算法
          const layoutConfig = nodes.length > 50 ? {
            // 大数据量使用 circular 布局（更快）
            type: 'circular',
            radius: 200,
            startAngle: 0,
            endAngle: Math.PI * 2,
            divisions: 5,
          } : {
            // 小数据量使用 force 布局（更美观）
            type: 'force',
            linkDistance: 150,
            nodeStrength: -150,
            edgeStrength: 0.2,
            preventOverlap: true,
            nodeSize: 60,
            // 限制迭代次数，加快渲染
            maxIteration: 200,
          };

          graphRef.current = new Graph({
            container: containerRef.current,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            fitView: true,
            fitViewPadding: 50,
            modes: {
              default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
            },
            layout: layoutConfig,
            defaultNode: {
              size: 60,
              style: {
                fill: '#e6f7ff',
                stroke: '#1890ff',
                lineWidth: 2,
              },
              labelCfg: {
                style: {
                  fill: '#000',
                  fontSize: 14,
                }
              }
            },
            defaultEdge: {
              style: {
                stroke: '#999',
                lineWidth: 2,
                endArrow: {
                  path: 'M 0,0 L 8,4 L 8,-4 Z',
                  fill: '#999',
                },
              },
              labelCfg: {
                autoRotate: true,
                style: {
                  fill: '#666',
                  fontSize: 12,
                }
              }
            },
          });

          graphRef.current.data(graphData);
          graphRef.current.render();
          console.log('Graph 渲染完成');
        } else {
          // 更新数据 - 销毁旧实例，创建新实例（更可靠）
          console.log('销毁旧 Graph 实例并重新创建');
          
          try {
            graphRef.current.destroy();
          } catch (e) {
            console.warn('销毁旧实例失败:', e);
          }
          
          graphRef.current = null;
          
          // 根据节点数量选择布局算法
          const layoutConfig = nodes.length > 50 ? {
            type: 'circular',
            radius: 200,
            startAngle: 0,
            endAngle: Math.PI * 2,
            divisions: 5,
          } : {
            type: 'force',
            linkDistance: 150,
            nodeStrength: -150,
            edgeStrength: 0.2,
            preventOverlap: true,
            nodeSize: 60,
            maxIteration: 200,
          };

          graphRef.current = new Graph({
            container: containerRef.current,
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
            fitView: true,
            fitViewPadding: 50,
            modes: {
              default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
            },
            layout: layoutConfig,
            defaultNode: {
              size: 60,
              style: {
                fill: '#e6f7ff',
                stroke: '#1890ff',
                lineWidth: 2,
              },
              labelCfg: {
                style: {
                  fill: '#000',
                  fontSize: 14,
                }
              }
            },
            defaultEdge: {
              style: {
                stroke: '#999',
                lineWidth: 2,
                endArrow: {
                  path: 'M 0,0 L 8,4 L 8,-4 Z',
                  fill: '#999',
                },
              },
              labelCfg: {
                autoRotate: true,
                style: {
                  fill: '#666',
                  fontSize: 12,
                }
              }
            },
          });

          graphRef.current.data(graphData);
          graphRef.current.render();
          console.log('Graph 重新创建并渲染完成');
        }

        setIsRendering(false);
      } catch (error) {
        console.error('Graph 操作失败:', error);
        setIsRendering(false);
      }
    });

    // 响应式处理
    const handleResize = () => {
      if (graphRef.current && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        graphRef.current.changeSize(width, height);
        graphRef.current.fitView(50);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes, edges]);

  // 组件卸载时销毁
  useEffect(() => {
    return () => {
      if (graphRef.current) {
        console.log('销毁 Graph 实例');
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        background: '#fafafa' 
      }}
      ref={(el) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          console.log('GraphView 外层容器尺寸:', { 
            width: rect.width, 
            height: rect.height,
            left: rect.left,
            right: rect.right
          });
        }
      }}
    >
      {/* 加载项目数据中 */}
      {isLoadingProject ? (
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            width: '100%',
            color: '#666',
            fontSize: 16,
            gap: 16
          }}
        >
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div>正在加载卷宗数据...</div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : nodes.length === 0 ? (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            width: '100%',
            color: '#999',
            fontSize: 16
          }}
          ref={(el) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              console.log('GraphView 空状态容器尺寸:', { 
                width: rect.width, 
                height: rect.height 
              });
            }
          }}
        >
          暂无数据，请先进行文本炼化
        </div>
      ) : (
        <>
          {/* 渲染图谱中 */}
          {isRendering && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '20px 32px',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 32,
                height: 32,
                border: '3px solid #e0e0e0',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ fontSize: 14, color: '#666' }}>
                正在渲染图谱 ({nodes.length} 个节点)...
              </div>
            </div>
          )}
          <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
        </>
      )}
    </div>
  );
}