'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  Sparkles,
  FileClock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/traffic', label: 'Traffic', icon: Activity },
  { href: '/contacts', label: 'Contacts', icon: ClipboardList },
  { href: '/quotes', label: 'Quotes', icon: FileClock },
  { href: '/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/services', label: 'Services', icon: Sparkles },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/audit-logs', label: 'Audit Logs', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-r border-border bg-white lg:w-72">
      <div className="flex h-full flex-col p-4">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">UltraSpark</p>
          <h1 className="mt-2 text-xl font-semibold">Cleaning Admin</h1>
          <p className="mt-2 text-sm text-emerald-100">
            Leads, requests, and operations in one place.
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-secondary text-primary'
                    : 'text-slate-600 hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
