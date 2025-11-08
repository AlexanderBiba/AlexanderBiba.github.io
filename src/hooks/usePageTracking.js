import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// GA4 Measurement ID - centralized for easy updates
const GA4_MEASUREMENT_ID = 'G-TSRMJ7J8LH';

/**
 * Custom hook to track page views in Google Analytics 4
 * Automatically tracks page views when the route changes
 * 
 * This hook:
 * - Tracks all route changes including SPA navigation
 * - Sends explicit page_view events to GA4
 * - Updates page_path and page_title for accurate tracking
 * - Works with React Router for all routes including /blog/:slug
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Wait a tick to ensure document.title is updated by react-helmet
    // This is especially important for blog posts with dynamic titles
    const timeoutId = setTimeout(() => {
      const pagePath = location.pathname + location.search;
      const pageTitle = document.title;

      // Track page view in GA4
      if (typeof window !== 'undefined' && window.gtag) {
        // Update config with new page path and title
        window.gtag('config', GA4_MEASUREMENT_ID, {
          page_path: pagePath,
          page_title: pageTitle,
        });

        // Explicitly send page_view event for better tracking
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: pageTitle,
          page_location: window.location.href,
        });
      }

      // Track page view in Plausible (if available)
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('pageview');
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search]);
}

