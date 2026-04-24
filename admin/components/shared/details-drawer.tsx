'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DetailsDrawer({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition',
        open ? 'pointer-events-auto bg-slate-950/30' : 'pointer-events-none bg-transparent',
      )}
      onClick={onClose}
    >
      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l bg-white shadow-2xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b p-6">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-6 p-6">{children}</div>
      </aside>
    </div>
  );
}
