'use client';

import { useSyncExternalStore } from 'react';
import { Loader2 } from 'lucide-react';
import { isServerWaking, subscribeServerWaking } from '@/lib/api';

// Shown while a request is unusually slow: on the free plan the server sleeps when idle
// and needs up to a minute to wake up.
export default function ServerWakeBanner() {
  const waking = useSyncExternalStore(subscribeServerWaking, isServerWaking, () => false);
  if (!waking) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-gray-900 text-white text-sm px-4 py-2 shadow-lg max-w-[calc(100%-2rem)]"
    >
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      <span>Waking up the server… this can take up to a minute.</span>
    </div>
  );
}
