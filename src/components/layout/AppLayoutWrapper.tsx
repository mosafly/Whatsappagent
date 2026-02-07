'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';

interface AppLayoutWrapperProps {
  children: ReactNode;
}

// Routes that should NOT use the AppLayout (e.g., API routes, auth callbacks)
const EXCLUDED_PATHS = ['/api/'];

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();

  // Skip layout for excluded paths
  const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));

  if (isExcluded) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
