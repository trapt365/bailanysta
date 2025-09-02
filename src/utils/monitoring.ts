import { getEnvConfig } from '../server/middleware/envValidation';

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  environment: string;
  buildId?: string;
  sessionId: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  url: string;
  environment: string;
  additionalData?: Record<string, any>;
}

class MonitoringService {
  private sessionId: string;
  private isProduction: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = typeof window !== 'undefined' && 
      process.env.NODE_ENV === 'production';
    
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandler();
      this.setupUnhandledRejectionHandler();
      this.setupWebVitals();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Report an error to monitoring service
   */
  reportError(error: Error, context?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      environment: process.env.NODE_ENV || 'development',
      sessionId: this.sessionId,
      buildId: process.env.NEXT_BUILD_ID,
      ...context,
    };

    if (this.isProduction) {
      // In production, send to monitoring service
      this.sendToMonitoringService('error', errorReport);
    } else {
      // In development, log to console
      console.error('🚨 Error Report:', errorReport);
    }
  }

  /**
   * Report performance metrics
   */
  reportPerformance(name: string, value: number, additionalData?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      environment: process.env.NODE_ENV || 'development',
      additionalData,
    };

    if (this.isProduction) {
      this.sendToMonitoringService('performance', metric);
    } else {
      console.log('📊 Performance Metric:', metric);
    }
  }

  /**
   * Setup global error handler for uncaught JavaScript errors
   */
  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      this.reportError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  /**
   * Setup handler for unhandled promise rejections
   */
  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'unhandled-promise-rejection' }
      );
    });
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observeWebVital('largest-contentful-paint', (entry) => {
        this.reportPerformance('LCP', entry.startTime, {
          element: entry.element?.tagName,
          url: entry.url,
        });
      });

      // First Input Delay (FID)
      this.observeWebVital('first-input', (entry) => {
        this.reportPerformance('FID', entry.processingStart - entry.startTime, {
          name: entry.name,
          target: (entry.target as Element)?.tagName,
        });
      });

      // Cumulative Layout Shift (CLS)
      this.observeWebVital('layout-shift', (entry) => {
        if (!entry.hadRecentInput) {
          this.reportPerformance('CLS', entry.value, {
            sources: entry.sources?.map(source => ({
              element: source.node?.tagName,
              previousRect: source.previousRect,
              currentRect: source.currentRect,
            })),
          });
        }
      });
    }

    // Page Load Time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.reportPerformance('Page Load Time', loadTime);
    });
  }

  /**
   * Observe specific web vital metrics
   */
  private observeWebVital(entryType: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  /**
   * Send data to monitoring service (Vercel Analytics, future: Sentry)
   */
  private async sendToMonitoringService(type: 'error' | 'performance', data: any): Promise<void> {
    try {
      // For now, use Vercel Analytics API
      if (typeof window !== 'undefined') {
        // Vercel Analytics integration
        const event = {
          name: `${type}-report`,
          data: JSON.stringify(data),
        };

        // Send to Vercel Analytics
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to send to monitoring service:', error);
    }
  }

  /**
   * Track user interaction events
   */
  trackUserInteraction(action: string, category?: string, value?: number): void {
    this.reportPerformance('User Interaction', Date.now(), {
      action,
      category,
      value,
    });
  }

  /**
   * Track API response times
   */
  trackApiCall(endpoint: string, method: string, responseTime: number, status: number): void {
    this.reportPerformance('API Response Time', responseTime, {
      endpoint,
      method,
      status,
    });
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

/**
 * Higher-order component for error boundary integration
 */
export function withMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  return function MonitoredComponent(props: P) {
    React.useEffect(() => {
      // Track component mount
      monitoring.trackUserInteraction('Component Mount', WrappedComponent.name);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for monitoring API calls
 */
export function useApiMonitoring() {
  const trackApiCall = React.useCallback(
    (endpoint: string, method: string, startTime: number, status: number) => {
      const responseTime = performance.now() - startTime;
      monitoring.trackApiCall(endpoint, method, responseTime, status);
    },
    []
  );

  return { trackApiCall };
}