import { create } from 'zustand';

export type LogLevel = 'error' | 'warn' | 'info';

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
  hasUnreadErrors: boolean;
  addLog: (level: LogLevel, message: string, context?: any) => void;
  markAllRead: () => void;
  clearLogs: () => void;
}

export const useDevLogsStore = create<DevLogsStore>((set, get) => ({
  logs: [],
  hasUnreadErrors: false,
  
  addLog: (level, message, context) => {
    const newLog: DevLog = {
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      context,
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => ({
      logs: [newLog, ...state.logs],
      hasUnreadErrors: level === 'error' || state.hasUnreadErrors,
    }));
  },
  
  markAllRead: () => {
    set((state) => ({
      logs: state.logs.map((log) => ({ ...log, read: true })),
      hasUnreadErrors: false,
    }));
  },
  
  clearLogs: () => {
    set({ logs: [], hasUnreadErrors: false });
  },
}));

// Global error handler
export function logDevEvent(level: LogLevel, message: string, context?: any) {
  useDevLogsStore.getState().addLog(level, message, context);
}

// Intercept console errors and warnings
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    logDevEvent('error', args.join(' '), args);
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    logDevEvent('warn', args.join(' '), args);
    originalWarn.apply(console, args);
  };
}
