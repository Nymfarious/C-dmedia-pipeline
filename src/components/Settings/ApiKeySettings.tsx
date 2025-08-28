import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiKeySettingsProps {
  trigger?: React.ReactNode;
}

export function ApiKeySettings({ trigger }: ApiKeySettingsProps) {
  const [replicateKey, setReplicateKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if key exists in localStorage
    const savedKey = localStorage.getItem('replicate_api_key');
    if (savedKey) {
      setReplicateKey(savedKey);
      setIsConnected(true);
    }
  }, []);

  const testConnection = async () => {
    if (!replicateKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Replicate API key",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      // Test the API key by making a simple request
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${replicateKey}`,
        },
      });

      if (response.ok) {
        localStorage.setItem('replicate_api_key', replicateKey);
        setIsConnected(true);
        toast({
          title: "Success",
          description: "Replicate API key connected successfully!",
        });
      } else {
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Invalid API key or connection error",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Replicate API",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const removeKey = () => {
    localStorage.removeItem('replicate_api_key');
    setReplicateKey('');
    setIsConnected(false);
    toast({
      title: "API Key Removed",
      description: "Replicate API key has been removed",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            API Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API Key Settings</DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Replicate API</CardTitle>
                <CardDescription>
                  Connect your Replicate API key to enable AI generation
                </CardDescription>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replicate-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="replicate-key"
                    type={showKey ? "text" : "password"}
                    value={replicateKey}
                    onChange={(e) => setReplicateKey(e.target.value)}
                    placeholder="r8_..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={testConnection}
                disabled={isTestingConnection}
                className="flex-1"
              >
                {isTestingConnection ? "Testing..." : "Test Connection"}
              </Button>
              {isConnected && (
                <Button 
                  variant="outline" 
                  onClick={removeKey}
                >
                  Remove
                </Button>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Get your API key from{" "}
                <a 
                  href="https://replicate.com/account/api-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  replicate.com/account/api-tokens
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}