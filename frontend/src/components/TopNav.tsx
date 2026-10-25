'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeToken, usePageTitle } from '@/lib/auth';
import { getCurrentUser, SessionUser } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface TopNavProps {
  title: string;
  subtitle?: string;
  // Browser tab title; defaults to `title`
  pageTitle?: string;
}

export default function TopNav({ title, subtitle, pageTitle }: TopNavProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  usePageTitle(pageTitle ?? title);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <div className="bg-white border-b px-4 sm:px-8 py-4 flex justify-between items-center gap-4">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {user && (
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm font-semibold text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-500">{user.role?.role_name}</div>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
