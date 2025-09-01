import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import { Dashboard } from './components/Dashboard';
import { AssetMigrationToast } from './components/AssetMigrationToast';
import { AssetsPage } from './components/AssetsPage';
import { AIGalleryPanel } from './components/AIGalleryPanel';
import useAppStore from './store/appStore';
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Create singleton QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});

function AppWrapper() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize store once on app load
  useEffect(() => {
    let isMounted = true;
    let hasInitialized = false;
    
    async function initializeStore() {
      if (hasInitialized) return; // Prevent multiple initializations
      hasInitialized = true;
      
      try {
        console.log('App initializing store...');
        const { hydrate, migrateExpiredAssets } = useAppStore.getState();
        
        // Hydrate first
        await hydrate();
        
        // Then migrate expired assets
        await migrateExpiredAssets();
        
        if (isMounted) {
          setIsInitialized(true);
          console.log('Store initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize store:', error);
        if (isMounted) {
          setIsInitialized(true); // Still show app even if hydration fails
        }
      }
    }
    
    initializeStore();
    return () => { isMounted = false; };
  }, []);

  // Don't render until store is initialized
  if (!isInitialized) {
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeStore() {
      try {
        const { hydrate, migrateExpiredAssets } = useAppStore.getState();
        await hydrate();
        await migrateExpiredAssets();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize store:', error);
        setIsInitialized(true);
      }
    }
    
    initializeStore();
  }, []);

  if (!isInitialized) {
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
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      <AssetsPage onSelectImage={() => window.location.href = '/'} />
      <AssetMigrationToast />
    </div>
  );
}

function AIGalleryPageWrapper() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function initializeStore() {
      try {
        const { hydrate, migrateExpiredAssets } = useAppStore.getState();
        await hydrate();
        await migrateExpiredAssets();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize store:', error);
        setIsInitialized(true);
      }
    }
    
    initializeStore();
  }, []);

  if (!isInitialized) {
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
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </Button>
        </div>
      </div>
      <AIGalleryPanel onSelectImage={() => window.location.href = '/'} />
      <AssetMigrationToast />
    </div>
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
      <AuthGuard>
        <AppWrapper />
      </AuthGuard>
    )
  },
  {
    path: "/assets", 
    element: (
      <AuthGuard>
        <AssetsPageWrapper />
      </AuthGuard>
    )
  },
  {
    path: "/ai-gallery",
    element: (
      <AuthGuard>
        <AIGalleryPageWrapper />
      </AuthGuard>
    )
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
