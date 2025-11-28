import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import { Dashboard } from './components/Dashboard';
import { AssetMigrationToast } from './components/AssetMigrationToast';
import { AssetsPage } from './components/AssetsPage';
import { AIGalleryPanel } from './components/AIGalleryPanel';
import { ImageGenStudioPageWrapper } from './components/ImageGenStudio/ImageGenStudioPageWrapper';
import { TimelineWorkspace } from './components/workspace/TimelineWorkspace';
import { ModeFerryProvider } from './components/workspace/ModeFerryContext';
import { ModeFerry } from './components/workspace/ModeFerry';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useCanvasAutoCleanup } from '@/hooks/useCanvasAutoCleanup';
import { MiniDevProvider, MiniDevButton, MiniDevDrawer } from '@/mini-devtools';
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Debug } from "./pages/Debug";

// Create singleton QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

function AppWrapper() {
  const isHydrating = useAppBootstrap();
  useCanvasAutoCleanup();

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard />
      <AssetMigrationToast />
    </>
  );
}

function AssetsPageWrapper() {
  const navigate = useNavigate();
  const isHydrating = useAppBootstrap();

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-foreground">AI Media Pipeline</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      <AssetsPage onSelectImage={() => navigate('/')} />
      <AssetMigrationToast />
    </div>
  );
}

function AIGalleryPageWrapper() {
  const navigate = useNavigate();
  const isHydrating = useAppBootstrap();

  if (isHydrating) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-foreground">AI Media Pipeline</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      <AIGalleryPanel onSelectImage={() => navigate('/')} />
      <AssetMigrationToast />
    </div>
  );
}

// Layout component that includes DevTools and ModeFerry
function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ModeFerry />
      <MiniDevButton />
      <MiniDevDrawer />
    </>
  );
}

// Create router with v7 future flags
const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />
  },
  {
    path: "/",
    element: (
      <RootLayout>
        <AuthGuard>
          <AppWrapper />
        </AuthGuard>
      </RootLayout>
    )
  },
  {
    path: "/assets", 
    element: (
      <RootLayout>
        <AuthGuard>
          <AssetsPageWrapper />
        </AuthGuard>
      </RootLayout>
    )
  },
  {
    path: "/ai-gallery",
    element: (
      <RootLayout>
        <AuthGuard>
          <AIGalleryPageWrapper />
        </AuthGuard>
      </RootLayout>
    )
  },
   {
     path: "/image-gen-studio",
     element: (
       <RootLayout>
         <AuthGuard>
           <ImageGenStudioPageWrapper />
         </AuthGuard>
       </RootLayout>
     )
   },
   {
      path: "/debug",
      element: (
        <RootLayout>
          <AuthGuard>
            <Debug />
          </AuthGuard>
        </RootLayout>
      )
    },
    {
      path: "/workspace",
      element: (
        <RootLayout>
          <AuthGuard>
            <TimelineWorkspace />
          </AuthGuard>
        </RootLayout>
      )
    },
    {
      path: "*",
      element: (
        <RootLayout>
          <NotFound />
        </RootLayout>
      )
    }
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ModeFerryProvider>
        <MiniDevProvider
          config={{
            app: {
              name: 'Storybook',
              version: '0.1.0',
              environment: 'dev',
            },
            position: 'bottom-right',
          }}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RouterProvider 
              router={router} 
              future={{ 
                v7_startTransition: true
              }} 
            />
          </TooltipProvider>
        </MiniDevProvider>
      </ModeFerryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
