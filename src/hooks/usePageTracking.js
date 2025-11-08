import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to track page views in Google Analytics 4
 * Automatically tracks page views when the route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-TSRMJ7J8LH', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }

    // Track page view in Plausible (if available)
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('pageview');
    }
  }, [location]);
}

