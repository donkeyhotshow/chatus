import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Enhanced mobile utilities
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    supportsVibration: false,
    orientation: 'portrait' as 'portrait' | 'landscape'
  });

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;

      setDeviceInfo({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        isIOS: /iPad|iPhone|iPod/.test(userAgent),
        isAndroid: /Android/.test(userAgent),
        supportsVibration: 'vibrate' in navigator,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    updateDeviceInfo();

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const orientationQuery = window.matchMedia('(orientation: portrait)');

    mediaQuery.addEventListener('change', updateDeviceInfo);
    orientationQuery.addEventListener('change', updateDeviceInfo);
    window.addEventListener('resize', updateDeviceInfo);

    return () => {
      mediaQuery.removeEventListener('change', updateDeviceInfo);
      orientationQuery.removeEventListener('change', updateDeviceInfo);
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

// Hook for haptic feedback
export function useHapticFeedback() {
  const vibrate = React.useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = React.useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = React.useCallback(() => vibrate(25), [vibrate]);
  const heavyTap = React.useCallback(() => vibrate(50), [vibrate]);
  const doubleTap = React.useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const errorFeedback = React.useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  const successFeedback = React.useCallback(() => vibrate([10, 25, 10]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    errorFeedback,
    successFeedback
  };
}
