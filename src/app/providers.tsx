'use client';

import ClientProviders from '@/contexts/AppProviders';

export function Providers({children}: {children: React.ReactNode}) {
  return <ClientProviders>{children}</ClientProviders>;
}
