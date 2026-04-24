import { Badge } from '@/components/ui/badge';

const styles: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  READ: 'bg-amber-50 text-amber-700',
  REPLIED: 'bg-emerald-50 text-emerald-700',
  ARCHIVED: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-orange-50 text-orange-700',
  QUOTED: 'bg-indigo-50 text-indigo-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  DECLINED: 'bg-rose-50 text-rose-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-teal-50 text-teal-700',
  CANCELLED: 'bg-rose-50 text-rose-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-700',
};

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status ?? 'UNKNOWN';
  return <Badge className={styles[value] ?? 'bg-slate-100 text-slate-700'}>{value}</Badge>;
}
