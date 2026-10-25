'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './auth';
import { getCurrentUser, isAdminUser } from './session';

// For Admin-only pages: sends logged-out visitors to /login and non-admins to the dashboard.
// Returns true once the current user is confirmed to be an Admin.
export function useAdminGuard(): boolean {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    getCurrentUser().then(user => {
      if (isAdminUser(user)) {
        setAllowed(true);
      } else {
        router.replace('/');
      }
    });
  }, [router]);

  return allowed;
}
