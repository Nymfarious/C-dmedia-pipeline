import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FlowNode {
  id: string;
  label: string;
  type: 'page' | 'action' | 'modal';
  x: number;
  y: number;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

const initialNodes: FlowNode[] = [
  { id: 'home', label: 'Home', type: 'page', x: 100, y: 50 },
  { id: 'projects', label: 'Projects', type: 'page', x: 300, y: 50 },
  { id: 'editor', label: 'Editor', type: 'page', x: 300, y: 200 },
  { id: 'reader', label: 'Reader', type: 'page', x: 100, y: 200 },
  { id: 'settings', label: 'Settings', type: 'modal', x: 500, y: 125 },
];

const edges: FlowEdge[] = [
  { from: 'home', to: 'projects', label: 'view all' },
  { from: 'projects', to: 'editor', label: 'edit' },
  { from: 'projects', to: 'reader', label: 'read' },
  { from: 'home', to: 'reader', label: 'continue' },
  { from: 'editor', to: 'settings' },
  { from: 'reader', to: 'settings' },
];

export function FlowchartPanel() {
  const [nodes, setNodes] = useState(initialNodes);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const getTypeColor = (type: FlowNode['type']) => {
    switch (type) {
      case 'page': return 'fill-blue-500/20 stroke-blue-500';
      case 'action': return 'fill-purple-500/20 stroke-purple-500';
      case 'modal': return 'fill-slate-500/20 stroke-slate-500';
    }
  };

  const getTypeBadgeVariant = (type: FlowNode['type']) => {
    switch (type) {
      case 'page': return 'default';
      case 'action': return 'secondary';
      case 'modal': return 'outline';
    }
  };

  const handleMouseDown = (nodeId: string) => {
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setNodes(prev => prev.map(node => 
      node.id === draggedNode ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Find node positions for edges
  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            Route Map
            <Badge variant="secondary" className="text-xs">
              {nodes.length} nodes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <svg
            width="100%"
            height="400"
            className="bg-slate-900/50 rounded-lg cursor-move"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Render edges */}
            {edges.map((edge, i) => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g key={i}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-slate-600"
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.label && (
                    <text
                      x={midX}
                      y={midY - 5}
                      fontSize="10"
                      fill="currentColor"
                      className="text-slate-400"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render nodes */}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={() => handleMouseDown(node.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <rect
                  x="-40"
                  y="-20"
                  width="80"
                  height="40"
                  rx="8"
                  className={getTypeColor(node.type)}
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="currentColor"
                  className="text-slate-100 pointer-events-none select-none"
                >
                  {node.label}
                </text>
              </g>
            ))}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                className="text-slate-600"
              >
                <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
              </marker>
            </defs>
          </svg>

          <div className="mt-4 flex gap-2">
            {(['page', 'action', 'modal'] as const).map((type) => (
              <Badge key={type} variant={getTypeBadgeVariant(type)} className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
