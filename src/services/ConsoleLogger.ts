import { ILogger, LogLevel } from './ILogger';

/**
 * Console-based logger for development
 * In production, this could write to files or send to error tracking service
 */
export class ConsoleLogger implements ILogger {
  private minLevel: LogLevel;
  private enableAnalytics: boolean;

  constructor(minLevel: LogLevel = LogLevel.INFO, enableAnalytics: boolean = false) {
    this.minLevel = minLevel;
    this.enableAnalytics = enableAnalytics;
  }

  error(message: string, error?: Error, context?: any): void {
    if (this.minLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, context);
      
      // In production, send to error tracking service (Sentry, etc.)
      if (error) {
        console.error('Stack trace:', error.stack);
      }
    }
  }

  warn(message: string, context?: any): void {
    if (this.minLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  info(message: string, context?: any): void {
    if (this.minLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  debug(message: string, context?: any): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    if (!this.enableAnalytics) return;
    
    // In production, send to analytics service (PostHog, etc.)
    console.log(`[ANALYTICS] Event: ${event}`, properties);
  }

  trackTiming(metric: string, duration: number): void {
    if (!this.enableAnalytics) return;
    
    // In production, send to performance monitoring
    console.log(`[TIMING] ${metric}: ${duration}ms`);
  }
}
