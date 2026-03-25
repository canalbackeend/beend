'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const RespondentsContent = dynamic(
  () => import('./respondents-content').then((mod) => ({ default: mod.RespondentsContent })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export function RespondentsWrapper() {
  return <RespondentsContent />;
}
