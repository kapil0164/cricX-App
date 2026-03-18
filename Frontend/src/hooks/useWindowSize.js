import { useState, useEffect } from "react";

/**
 * Returns { width, isMobile, isTablet, isDesktop }
 * Breakpoints:
 *   mobile  < 768px
 *   tablet  768px – 1099px
 *   desktop ≥ 1100px
 */
export function useWindowSize() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    width,
    isMobile:  width < 768,
    isTablet:  width >= 768 && width < 1100,
    isDesktop: width >= 1100,
  };
}