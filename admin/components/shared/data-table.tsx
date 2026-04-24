import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from './empty-state';

export type Column<T> = {
  key: string;
  title: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  title,
  columns,
  data,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  columns: Column<T>[];
  data: T[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`pb-3 pr-4 font-medium ${column.className ?? ''}`}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className={`py-4 pr-4 align-top ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
