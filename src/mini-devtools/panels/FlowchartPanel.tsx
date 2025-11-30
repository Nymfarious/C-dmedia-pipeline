import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronRight, ExternalLink, MousePointer2, Move } from 'lucide-react';
import { PopoutWindow } from '../components/PopoutWindow';

interface FlowNode {
  id: string;
  label: string;
  type: 'page' | 'action' | 'modal';
  x: number;
  y: number;
  description?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

const initialNodes: FlowNode[] = [
  { id: 'home', label: 'Home', type: 'page', x: 100, y: 50, description: 'Main landing page' },
  { id: 'projects', label: 'Projects', type: 'page', x: 300, y: 50, description: 'Project list view' },
  { id: 'editor', label: 'Editor', type: 'page', x: 300, y: 200, description: 'Canvas editor page' },
  { id: 'reader', label: 'Reader', type: 'page', x: 100, y: 200, description: 'Asset reader view' },
  { id: 'settings', label: 'Settings', type: 'modal', x: 500, y: 125, description: 'Settings modal dialog' },
  { id: 'save', label: 'Save', type: 'action', x: 500, y: 50, description: 'Save project action' },
  { id: 'export', label: 'Export', type: 'action', x: 500, y: 200, description: 'Export assets action' },
];

const edges: FlowEdge[] = [
  { from: 'home', to: 'projects', label: 'view all' },
  { from: 'projects', to: 'editor', label: 'edit' },
  { from: 'projects', to: 'reader', label: 'read' },
  { from: 'home', to: 'reader', label: 'continue' },
  { from: 'editor', to: 'settings' },
  { from: 'reader', to: 'settings' },
  { from: 'projects', to: 'save' },
  { from: 'editor', to: 'export' },
];

// SVG dimensions for viewBox
const SVG_WIDTH = 600;
const SVG_HEIGHT = 300;
const EXPANDED_SVG_WIDTH = 900;
const EXPANDED_SVG_HEIGHT = 500;

interface FlowchartContentProps {
  isExpanded?: boolean;
}

function FlowchartContent({ isExpanded = false }: FlowchartContentProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const svgWidth = isExpanded ? EXPANDED_SVG_WIDTH : SVG_WIDTH;
  const svgHeight = isExpanded ? EXPANDED_SVG_HEIGHT : SVG_HEIGHT;

  const getTypeColor = (type: FlowNode['type']) => {
    switch (type) {
      case 'page': return 'fill-blue-500/20 stroke-blue-500';
      case 'action': return 'fill-purple-500/20 stroke-purple-500';
      case 'modal': return 'fill-amber-500/20 stroke-amber-500';
    }
  };

  const getTypeBadgeVariant = (type: FlowNode['type']): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'page': return 'default';
      case 'action': return 'secondary';
      case 'modal': return 'outline';
    }
  };

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (isMobile && !isExpanded) return;
    e.stopPropagation();
    setDraggedNode(nodeId);
    setSelectedNode(nodeId);
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;
    const x = Math.max(50, Math.min(svgWidth - 50, (e.clientX - rect.left) * scaleX));
    const y = Math.max(30, Math.min(svgHeight - 30, (e.clientY - rect.top) * scaleY));

    setNodes(prev => prev.map(node => 
      node.id === draggedNode ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  const getNodeById = (id: string) => nodes.find(n => n.id === id);
  const selectedNodeData = selectedNode ? getNodeById(selectedNode) : null;

  // Build flow paths for list view
  const flowPaths = [
    ['home', 'projects', 'editor'],
    ['home', 'projects', 'reader'],
    ['home', 'reader'],
    ['editor', 'settings'],
    ['reader', 'settings'],
    ['projects', 'save'],
    ['editor', 'export'],
  ];

  return (
    <div className="space-y-4">
      {/* SVG Flowchart - Responsive Container */}
      <div className="w-full max-w-full overflow-hidden">
        <svg
          className={`w-full h-auto bg-background/50 rounded-lg ${(isMobile && !isExpanded) ? '' : 'cursor-move'}`}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleBackgroundClick}
          style={{ minHeight: isExpanded ? '400px' : (isMobile ? '150px' : '250px') }}
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
                {edge.label && (!isMobile || isExpanded) && (
                  <text
                    x={midX}
                    y={midY - 5}
                    fontSize={isExpanded ? '12' : '10'}
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
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const nodeWidth = isExpanded ? 100 : 80;
            const nodeHeight = isExpanded ? 50 : 40;
            
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onClick={(e) => handleNodeClick(node.id, e)}
                className={`${(isMobile && !isExpanded) ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
              >
                {/* Selection highlight */}
                {isSelected && (
                  <rect
                    x={-nodeWidth/2 - 4}
                    y={-nodeHeight/2 - 4}
                    width={nodeWidth + 8}
                    height={nodeHeight + 8}
                    rx="10"
                    className="fill-transparent stroke-primary stroke-2"
                    strokeDasharray="4 2"
                  />
                )}
                <rect
                  x={-nodeWidth/2}
                  y={-nodeHeight/2}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  className={getTypeColor(node.type)}
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isExpanded ? '14' : (isMobile ? '10' : '12')}
                  fill="currentColor"
                  className="text-foreground pointer-events-none select-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}

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

      {/* Selected Node Details */}
      {selectedNodeData && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={getTypeBadgeVariant(selectedNodeData.type)}>
                  {selectedNodeData.type}
                </Badge>
                <span className="font-medium text-foreground">{selectedNodeData.label}</span>
              </div>
              <MousePointer2 className="h-4 w-4 text-muted-foreground" />
            </div>
            {selectedNodeData.description && (
              <p className="text-sm text-muted-foreground mt-2">{selectedNodeData.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile List View Fallback */}
      {isMobile && !isExpanded && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Route Paths:</p>
          {flowPaths.slice(0, 4).map((path, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs flex-wrap">
              {path.map((nodeId, nodeIdx) => {
                const node = getNodeById(nodeId);
                return (
                  <span key={nodeId} className="flex items-center gap-1">
                    <Badge 
                      variant={getTypeBadgeVariant(node?.type || 'page')} 
                      className="text-xs py-0 px-2 cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedNode(nodeId)}
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
      <div className="flex gap-2 flex-wrap items-center">
        {(['page', 'action', 'modal'] as const).map((type) => (
          <Badge key={type} variant={getTypeBadgeVariant(type)} className="text-xs">
            {type}
          </Badge>
        ))}
        {(!isMobile || isExpanded) && (
          <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
            <Move className="h-3 w-3" /> drag nodes to rearrange
          </span>
        )}
      </div>
    </div>
  );
}

export function FlowchartPanel() {
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground flex items-center gap-2 text-base md:text-lg">
              Route Map
              <Badge variant="secondary" className="text-xs">
                {initialNodes.length} nodes
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPopoutOpen(true)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Pop Out
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <FlowchartContent />
        </CardContent>
      </Card>

      {/* Popout Window */}
      <PopoutWindow
        isOpen={isPopoutOpen}
        onClose={() => setIsPopoutOpen(false)}
        title="Route Map - Expanded View"
      >
        <FlowchartContent isExpanded />
      </PopoutWindow>
    </div>
  );
}
