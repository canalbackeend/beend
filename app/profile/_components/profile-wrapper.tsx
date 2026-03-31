'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ProfileContent = dynamic(() => import('./profile-content'), {
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  ),
});

export default function ProfileWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
