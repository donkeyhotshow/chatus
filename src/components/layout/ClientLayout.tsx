'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandlers } from '@/lib/global-error-handler';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return <>{children}</>;
}
