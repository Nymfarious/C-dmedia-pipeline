import { logDevEvent } from '@/mini-devtools/stores/devLogsStore';
import { recordPipelineEvent } from '@/mini-devtools/stores/pipelineStore';

export type TimelineSeverity = 'info' | 'warn' | 'error';

export interface TimelineLogEntry {
  action: string;
  severity: TimelineSeverity;
  component: 'TimelineCore' | 'Playback' | 'Cut' | 'Mend' | 'Clip' | 'Preview';
  details?: Record<string, any>;
  timestamp: Date;
}

// Track error count for severity dot system
let errorCount = 0;
let warnCount = 0;

export const getTimelineErrorCount = () => errorCount;
export const getTimelineWarnCount = () => warnCount;
export const resetTimelineCounts = () => {
  errorCount = 0;
  warnCount = 0;
};

export const logTimelineEvent = (
  severity: TimelineSeverity,
  action: string,
  details?: Record<string, any>
) => {
  // Track counts
  if (severity === 'error') errorCount++;
  if (severity === 'warn') warnCount++;

  // Log to DevTools
  logDevEvent(severity, `[Timeline] ${action}`, details);

  // Also log to pipeline monitor for Cut/Mend operations
  if (details?.operation === 'cut' || details?.operation === 'mend') {
    try {
      recordPipelineEvent({
        step: 'edit_image', // Closest matching step type
        provider: 'gemini-2.5', // Generic provider
        duration: details.duration || 300,
        success: severity !== 'error',
        metadata: {
          operation: details.operation,
          action,
        },
      });
    } catch {
      // Pipeline store may not be available
    }
  }
};

// Convenience functions for common events
export const logClipAdded = (trackType: string, startTime: number, duration: number) => {
  logTimelineEvent('info', `Clip added to ${trackType} track at ${startTime.toFixed(1)}s`, {
    trackType,
    startTime,
    duration,
  });
};

export const logClipRemoved = (trackType: string, clipLabel: string) => {
  logTimelineEvent('info', `Clip "${clipLabel}" removed from ${trackType} track`, {
    trackType,
    clipLabel,
  });
};

export const logCutOperation = (type: 'inside' | 'outside', durationRemoved: number) => {
  logTimelineEvent('info', `Cut ${type}: removed ${durationRemoved.toFixed(1)}s`, {
    operation: 'cut',
    type,
    durationRemoved,
  });
};

export const logMendComplete = (position: number) => {
  logTimelineEvent('info', 'Mend complete - timeline stitched', {
    operation: 'mend',
    position,
    duration: 0.3,
  });
};

export const logPlaybackError = (error: string, details?: Record<string, any>) => {
  logTimelineEvent('error', `Playback error: ${error}`, {
    ...details,
    error,
  });
};

export const logAudioError = (clipLabel: string, error: string) => {
  logTimelineEvent('error', `Audio error for "${clipLabel}": ${error}`, {
    clipLabel,
    error,
  });
};
