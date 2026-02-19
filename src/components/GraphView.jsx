import React, { useEffect, useRef } from 'react';
import { Graph } from '@antv/g6';
import { useRelationStore } from '../store/useRelationStore';
import { G6_BASE_CONFIG, RELATION_THEMES, SECT_COLORS } from '../config/graphConfig';

const GraphView = () => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const { nodes, edges } = useRelationStore();

  useEffect(() => {
    if (!graphRef.current && containerRef.current) {
      graphRef.current = new Graph({
        container: containerRef.current,
        width: containerRef.current.scrollWidth || 800,
        height: 600,
        ...G6_BASE_CONFIG,
      });
    }

    const formattedData = {
      nodes: nodes.map(n => ({
        id: n.id,
        data: { label: n.label, sect: n.sect },
        type: 'circle',
        style: {
          fill: '#fff',
          stroke: SECT_COLORS[n.sect] || SECT_COLORS['未知'],
          lineWidth: 2,
          size: 45,
          labelText: n.label,
          labelFill: '#333',
          labelFontSize: 12,
          labelPlacement: 'center',
          labelFontWeight: 'bold',
        }
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target,
        data: { label: e.label, relationType: e.type },
        type: 'quadratic', 
        style: {
          stroke: RELATION_THEMES[e.type]?.color || '#ccc',
          lineDash: RELATION_THEMES[e.type]?.lineDash,
          labelText: e.label,
          labelFill: '#666',
          labelFontSize: 10,
          endArrow: true,
        }
      }))
    };

    if (graphRef.current) {
      graphRef.current.setData(formattedData);
      graphRef.current.render();
    }
  }, [nodes, edges]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '600px' }} />;
};

export default GraphView;