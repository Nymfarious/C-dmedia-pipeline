import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Temporary placeholder while authentication is disabled
// This page no longer calls Supabase or performs any real auth.

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately send users back to the main app
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Media Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Authentication is temporarily disabled while setup is in progress.
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Authentication Disabled</CardTitle>
            <CardDescription className="text-center">
              You can continue using the app without signing in for now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/')}> 
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
