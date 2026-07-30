import { useEffect, useState } from "react";

const BREAKPOINT_PX = 768;

// Drives which layout App.jsx renders — the 3-column desktop layout, or
// the tab-based mobile one. A simple width check rather than a full
// responsive system, since the two layouts are different enough (fixed
// 3-column vs. one-screen-at-a-time) that a CSS breakpoint alone can't
// switch between them — the component tree itself needs to change.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < BREAKPOINT_PX : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < BREAKPOINT_PX);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
