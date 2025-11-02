import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // Check for hash with a delay to handle cases where hash is set after navigation
        const scrollToHash = () => {
            // Get hash from location or window (fallback)
            const hashFragment = hash || window.location.hash;
            
            if (hashFragment) {
                // If there's a hash, scroll to that element
                const element = document.querySelector(hashFragment);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    return true; // Successfully scrolled to hash
                }
            }
            return false; // No hash or element not found
        };

        // Try immediately
        if (!scrollToHash()) {
            // If no hash or element not found, try again after a delay
            // This handles cases where hash is set programmatically after navigation
            const timeoutId = setTimeout(() => {
                if (!scrollToHash()) {
                    // If still no hash, scroll to top
                    window.scrollTo(0, 0);
                }
            }, 150);

            return () => clearTimeout(timeoutId);
        }
    }, [pathname, hash]);

    return null;
}

