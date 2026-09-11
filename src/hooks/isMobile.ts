"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // 1. Initialize state as undefined to prevent SSR hydration mismatches
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // 2. Read directly from the media query list parameter matches field
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // 3. Register the event tracker safely
    mql.addEventListener("change", onChange);

    // 4. Fire the callback function to set the initial state correctly
    onChange();

    // 5. Clean up safely on component unmount
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
