'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import { getCurrentUser, isAdminUser } from '@/lib/session';

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getCurrentUser().then(user => setIsAdmin(isAdminUser(user)));
  }, []);

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    // Example question bank management is Admin-only
    ...(isAdmin ? [
      { name: 'Subjects', href: '/subjects', icon: BookOpen },
      { name: 'Questions', href: '/questions', icon: HelpCircle },
    ] : []),
    { name: 'Tests', href: '/tests', icon: ClipboardList },
    { name: 'Results', href: '/results', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-indigo-900 min-h-screen fixed left-0 top-0 text-white">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
          <span className="text-indigo-900 font-bold text-sm">EA</span>
        </div>
        <span className="font-bold leading-tight">EvaluatorAI</span>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? 'bg-indigo-800 border-l-4 border-white'
                  : 'hover:bg-indigo-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
