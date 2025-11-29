import { ModeNavigation } from '@/components/ModeNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  Home, 
  Layers,
  Clock,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useNavigate, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
}

export function WorkspaceHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current context from path
  const getCurrentMode = () => {
    if (location.pathname === '/workspace') return 'Timeline';
    if (location.pathname === '/') return 'Editor';
    return 'Workspace';
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/', icon: <Home className="h-3.5 w-3.5" /> },
    { label: 'Project', href: '/' },
    { label: getCurrentMode(), active: true },
  ];

  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-3 md:px-4 bg-card/50 gap-2">
      {/* Left side - Breadcrumb navigation */}
      <nav className="flex items-center gap-1 min-w-0 flex-shrink">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
            )}
            
            {item.href && !item.active ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate(item.href!)}
              >
                {item.icon && <span className="mr-1">{item.icon}</span>}
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ) : (
              <span className="px-2 py-1 text-xs font-medium text-foreground flex items-center gap-1">
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Center - Mode Navigation */}
      <div className="flex-shrink-0">
        <ModeNavigation />
      </div>

      {/* Right side - Status and actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Phase indicator */}
        <Badge 
          variant="outline" 
          className="hidden md:flex text-xs bg-muted/30 border-border/50"
        >
          <Clock className="h-3 w-3 mr-1" />
          Phase 1
        </Badge>
        
        {/* Quick actions */}
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help & Shortcuts</TooltipContent>
          </Tooltip>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Layers className="h-4 w-4 mr-2" />
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Return to Editor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
