import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'

function AppWithShortcuts() {
  useGlobalShortcuts();
  return <App />;
}

createRoot(document.getElementById("root")!).render(<AppWithShortcuts />);
