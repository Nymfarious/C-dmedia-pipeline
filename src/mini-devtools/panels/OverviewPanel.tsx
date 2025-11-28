import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useDevToolsStore } from '../stores/devToolsStore';
import { useMiniDevContext } from '../MiniDevContext';
import { User, Package, Calendar } from 'lucide-react';

export function OverviewPanel() {
  const navigate = useNavigate();
  const { config } = useMiniDevContext();
  const setActiveSection = useDevToolsStore((state) => state.setActiveSection);

  // Mock data - replace with actual Supabase data when available
  const currentUser = {
    display_name: 'Developer',
    email: 'dev@storybook.app',
    is_dev: true,
  };

  const currentProject = {
    title: 'AI Media Pipeline',
    project_type: 'Creative Tools',
    created_at: new Date('2024-01-15'),
  };

  return (
    <div className="space-y-3 md:space-y-4 overflow-x-hidden">
      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center justify-between text-sm md:text-base">
            <span>App Info</span>
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                config.app.environment === 'production' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : config.app.environment === 'staging'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              {config.app.environment}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-foreground/80">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-sm md:text-base truncate">{config.app.name}</span>
            <span className="text-muted-foreground text-xs md:text-sm">v{config.app.version}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm md:text-base">
            <User className="h-4 w-4 md:h-5 md:w-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-foreground/80">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm md:text-base">{currentUser.display_name}</span>
            {currentUser.is_dev && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                dev
              </Badge>
            )}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground truncate">{currentUser.email}</div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/50 border-border">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm md:text-base">
            <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            Current Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 md:space-y-2 text-foreground/80">
          <div className="font-medium text-sm md:text-base">{currentProject.title}</div>
          <div className="text-xs md:text-sm text-muted-foreground">{currentProject.project_type}</div>
          <div className="text-xs md:text-sm text-muted-foreground">
            Created: {currentProject.created_at.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Responsive button layout - stack on mobile */}
      <div className="flex flex-col md:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-secondary/50 border-border text-foreground/80 hover:bg-secondary/80 text-sm h-10 md:h-9 touch-manipulation"
          onClick={() => navigate('/projects')}
        >
          View Projects
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-secondary/50 border-border text-foreground/80 hover:bg-secondary/80 text-sm h-10 md:h-9 touch-manipulation"
          onClick={() => setActiveSection('apis')}
        >
          API Registry
        </Button>
      </div>
    </div>
  );
}
