import { create } from 'zustand';

export type LogLevel = 'info' | 'warn' | 'error';

export interface DevLog {
  id: string;
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: Date;
  read: boolean;
}

interface DevLogsStore {
  logs: DevLog[];
  addLog: (log: Omit<DevLog, 'id' | 'timestamp' | 'read'>) => void;
  clearLogs: () => void;
  markAllRead: () => void;
  hasUnreadErrors: boolean;
}

export const useDevLogsStore = create<DevLogsStore>((set, get) => ({
  logs: [],
  hasUnreadErrors: false,
  
  addLog: (log) => {
    const newLog: DevLog = {
      ...log,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 100), // Keep last 100 logs
      hasUnreadErrors: log.level === 'error' ? true : state.hasUnreadErrors,
    }));
  },
  
  clearLogs: () => set({ logs: [], hasUnreadErrors: false }),
  
  markAllRead: () => set((state) => ({
    logs: state.logs.map(log => ({ ...log, read: true })),
    hasUnreadErrors: false,
  })),
}));

// Helper function for easy logging
export function logDevEvent(level: LogLevel, message: string, context?: any) {
  useDevLogsStore.getState().addLog({ level, message, context });
}

// Intercept console errors and warnings
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    logDevEvent('error', args.join(' '), { args });
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    logDevEvent('warn', args.join(' '), { args });
    originalWarn.apply(console, args);
  };
}
