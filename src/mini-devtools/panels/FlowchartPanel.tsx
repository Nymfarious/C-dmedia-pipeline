import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronRight } from 'lucide-react';

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

// SVG dimensions for viewBox
const SVG_WIDTH = 600;
const SVG_HEIGHT = 300;

export function FlowchartPanel() {
  const [nodes, setNodes] = useState(initialNodes);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const getTypeColor = (type: FlowNode['type']) => {
    switch (type) {
      case 'page': return 'fill-blue-500/20 stroke-blue-500';
      case 'action': return 'fill-purple-500/20 stroke-purple-500';
      case 'modal': return 'fill-muted/50 stroke-muted-foreground';
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
    // Disable drag on mobile to prevent scroll conflicts
    if (isMobile) return;
    setDraggedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode || isMobile) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_WIDTH / rect.width;
    const scaleY = SVG_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setNodes(prev => prev.map(node => 
      node.id === draggedNode ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Find node positions for edges
  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  // Build flow path for mobile list view
  const flowPaths = [
    ['home', 'projects', 'editor'],
    ['home', 'projects', 'reader'],
    ['home', 'reader'],
    ['editor', 'settings'],
    ['reader', 'settings'],
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
            Route Map
            <Badge variant="secondary" className="text-xs">
              {nodes.length} nodes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          {/* SVG Flowchart - Responsive Container */}
          <div className="w-full max-w-full overflow-hidden">
            <svg
              className={`w-full h-auto bg-background/50 rounded-lg ${isMobile ? '' : 'cursor-move'}`}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ minHeight: isMobile ? '150px' : '250px' }}
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
                      className="text-border"
                      markerEnd="url(#arrowhead)"
                    />
                    {edge.label && !isMobile && (
                      <text
                        x={midX}
                        y={midY - 5}
                        fontSize="10"
                        fill="currentColor"
                        className="text-muted-foreground"
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
                  className={isMobile ? '' : 'cursor-grab active:cursor-grabbing'}
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
                    fontSize={isMobile ? '10' : '12'}
                    fill="currentColor"
                    className="text-foreground pointer-events-none select-none"
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
                  className="text-border"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Mobile List View Fallback */}
          {isMobile && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Route Paths:</p>
              {flowPaths.slice(0, 3).map((path, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs flex-wrap">
                  {path.map((nodeId, nodeIdx) => {
                    const node = getNodeById(nodeId);
                    return (
                      <span key={nodeId} className="flex items-center gap-1">
                        <Badge 
                          variant={getTypeBadgeVariant(node?.type || 'page')} 
                          className="text-xs py-0 px-2"
                        >
                          {node?.label}
                        </Badge>
                        {nodeIdx < path.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {(['page', 'action', 'modal'] as const).map((type) => (
              <Badge key={type} variant={getTypeBadgeVariant(type)} className="text-xs">
                {type}
              </Badge>
            ))}
            {!isMobile && (
              <span className="text-xs text-muted-foreground ml-2">
                (drag nodes to rearrange)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
