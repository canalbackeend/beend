'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const CampaignsContent = dynamic(() => import('./campaigns-content').then(mod => ({ default: mod.CampaignsContent })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  ),
});

export function CampaignsWrapper() {
  return <CampaignsContent />;
}
