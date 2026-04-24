'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime, getName } from '@/lib/utils';

export default function SettingsPage() {
  const { admin } = useAuth();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">API URL</p>
            <p className="mt-1 break-all">{process.env.NEXT_PUBLIC_API_URL ?? 'Not configured'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Frontend URL</p>
            <p className="mt-1 break-all">https://ultrasparkcleaning.co.uk</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Admin URL</p>
            <p className="mt-1 break-all">https://admin.ultrasparkcleaning.co.uk</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logged-in admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
            <p className="mt-1">{getName(admin ?? undefined)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
            <p className="mt-1">{admin?.email ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Last login</p>
            <p className="mt-1">{formatDateTime(admin?.lastLoginAt)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
