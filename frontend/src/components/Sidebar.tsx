'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderOpen, 
  HelpCircle, 
  ClipboardList, 
  BarChart3 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Categories', href: '/categories', icon: FolderOpen },
    { name: 'Questions', href: '/questions', icon: HelpCircle },
    { name: 'Tests', href: '/tests', icon: ClipboardList },
    { name: 'Results', href: '/results', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-indigo-900 min-h-screen fixed left-0 top-0 text-white">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-indigo-900 font-bold text-lg">IP</span>
        </div>
        <span className="font-bold text-lg">Interview Platform</span>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

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