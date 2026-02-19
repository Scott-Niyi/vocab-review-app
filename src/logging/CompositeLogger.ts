import { ILogger } from '../services/ILogger';

/**
 * Composite logger that delegates to multiple logger instances
 * Allows logging to multiple destinations (console, file, etc.) simultaneously
 */
export class CompositeLogger implements ILogger {
  private loggers: ILogger[];

  constructor(loggers: ILogger[]) {
    this.loggers = loggers;
  }

  error(message: string, error?: Error, context?: any): void {
    for (const logger of this.loggers) {
      logger.error(message, error, context);
    }
  }

  warn(message: string, context?: any): void {
    for (const logger of this.loggers) {
      logger.warn(message, context);
    }
  }

  info(message: string, context?: any): void {
    for (const logger of this.loggers) {
      logger.info(message, context);
    }
  }

  debug(message: string, context?: any): void {
    for (const logger of this.loggers) {
      logger.debug(message, context);
    }
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    for (const logger of this.loggers) {
      logger.trackEvent(event, properties);
    }
  }

  trackTiming(metric: string, duration: number): void {
    for (const logger of this.loggers) {
      logger.trackTiming(metric, duration);
    }
  }
}
