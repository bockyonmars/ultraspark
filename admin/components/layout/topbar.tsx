'use client';

import { LogOut, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { getName } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/traffic': 'Traffic',
  '/contacts': 'Contacts',
  '/quotes': 'Quotes',
  '/bookings': 'Bookings',
  '/customers': 'Customers',
  '/services': 'Services',
  '/analytics': 'Analytics',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const { admin, logout } = useAuth();

  const pageTitle = useMemo(() => pageTitles[pathname] ?? 'UltraSpark Admin', [pathname]);
  const adminName = admin
    ? `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() || admin.email
    : 'there';

  function submitSearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <header className="flex flex-col gap-4 border-b border-border bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{pageTitle}</h2>
        <p className="text-sm text-slate-500">Welcome back, {adminName}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitSearch();
            }}
            placeholder="Search this page"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={submitSearch}>
          Search
        </Button>
        <Button variant="ghost" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
