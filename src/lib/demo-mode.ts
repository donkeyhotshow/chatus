/**
 * Demo mode for local testing without Firebase
 * Set NEXT_PUBLIC_DEMO_MODE=true in .env.local to enable
 */

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || 
         localStorage.getItem('demo_mode') === 'true';
};

export const enableDemoMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('demo_mode', 'true');
  }
};

export const disableDemoMode = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demo_mode');
  }
};

