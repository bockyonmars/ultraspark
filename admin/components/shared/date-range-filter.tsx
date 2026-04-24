import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ranges = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'All', value: 'all' },
] as const;

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border bg-white p-1">
      {ranges.map((range) => (
        <Button
          key={range.value}
          size="sm"
          variant="ghost"
          onClick={() => onChange(range.value)}
          className={cn(
            'rounded-lg',
            value === range.value ? 'bg-secondary text-primary hover:bg-secondary' : '',
          )}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
