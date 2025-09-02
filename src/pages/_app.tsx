import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { monitoring } from '../utils/monitoring';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize monitoring on app start
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Production monitoring initialized');
    }

    // Track page views
    monitoring.trackUserInteraction('Page View', window.location.pathname);

    // Track app initialization performance
    const initTime = performance.now();
    monitoring.reportPerformance('App Initialization', initTime, {
      component: Component.name,
    });
  }, [Component.name]);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}