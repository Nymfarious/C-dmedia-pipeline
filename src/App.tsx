import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { ToolbarTop } from './components/ToolbarTop';
import { RightPanel } from './components/RightPanel';
import { AIGalleryPanel } from './components/AIGalleryPanel';
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function EnhancedApp() {
  const [activeTab, setActiveTab] = useState('image');
  const [selectedTool, setSelectedTool] = useState('select');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleToolChange = (tool: string) => {
    setSelectedTool(tool);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleRightPanel = () => {
    setShowRightPanel(!showRightPanel);
  };

  const addToHistory = (action: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(action);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const renderMainContent = () => {
    if (activeTab === 'ai-gallery') {
      return <AIGalleryPanel onSelectImage={() => setActiveTab('image')} />;
    }

    return (
      <div className="flex flex-col flex-1">
        <ToolbarTop
          activeTab={activeTab}
          selectedTool={selectedTool}
          onToolChange={handleToolChange}
          toggleRightPanel={toggleRightPanel}
        />
        <div className="flex flex-1">
          <Workspace
            activeTab={activeTab}
            selectedTool={selectedTool}
            addToHistory={addToHistory}
          />
          {showRightPanel && (
            <RightPanel
              activeTab={activeTab}
              history={history}
              historyIndex={historyIndex}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground">
      <Header
        activeTab={activeTab}
        undo={undo}
        redo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        {renderMainContent()}
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <AuthGuard>
                <EnhancedApp />
              </AuthGuard>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
