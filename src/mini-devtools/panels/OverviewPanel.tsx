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
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center justify-between">
            <span>App Info</span>
            <Badge 
              variant="secondary" 
              className={
                config.app.environment === 'production' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : config.app.environment === 'staging'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }
            >
              {config.app.environment}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-slate-300">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">{config.app.name}</span>
            <span className="text-slate-400 text-sm">v{config.app.version}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-medium">{currentUser.display_name}</span>
            {currentUser.is_dev && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                dev
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-400">{currentUser.email}</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-slate-300">
          <div className="font-medium">{currentProject.title}</div>
          <div className="text-sm text-slate-400">{currentProject.project_type}</div>
          <div className="text-sm text-slate-400">
            Created: {currentProject.created_at.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
          onClick={() => navigate('/projects')}
        >
          View Projects
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50"
          onClick={() => setActiveSection('apis')}
        >
          API Registry
        </Button>
      </div>
    </div>
  );
}
