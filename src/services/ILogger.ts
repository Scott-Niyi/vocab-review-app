/**
 * Logger interface for error tracking and analytics
 */
export interface ILogger {
  // Logging levels
  error(message: string, error?: Error, context?: any): void;
  warn(message: string, context?: any): void;
  info(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  
  // Analytics (privacy-respecting)
  trackEvent(event: string, properties?: Record<string, any>): void;
  trackTiming(metric: string, duration: number): void;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
