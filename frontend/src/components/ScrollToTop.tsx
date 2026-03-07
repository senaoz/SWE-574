import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to top on route change. Disables browser scroll restoration
 * and defers scroll until after paint so the new page isn't left scrolled down.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Prevent browser from restoring previous scroll position on navigation
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // Defer scroll so it runs after the new route has rendered and laid out
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
