import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

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
      <CardContent>
        <div className="space-y-3 md:hidden">
          {data.map((row, index) => {
            const [primaryColumn, ...detailColumns] = columns;

            return (
              <article
                key={index}
                className="rounded-xl border bg-white p-4 text-sm shadow-sm"
              >
                {primaryColumn ? (
                  <div className="min-w-0 break-words">
                    {primaryColumn.render(row)}
                  </div>
                ) : null}

                {detailColumns.length ? (
                  <dl className="mt-4 space-y-3">
                    {detailColumns.map((column) => (
                      <div
                        key={column.key}
                        className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-t pt-3 first:border-t-0 first:pt-0"
                      >
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {column.title}
                        </dt>
                        <dd
                          className={cn(
                            "min-w-0 break-words text-slate-800",
                            column.key === "actions" &&
                              "[&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center [&_button]:min-h-10",
                            column.className,
                          )}
                        >
                          {column.render(row)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn("pb-3 pr-4 font-medium", column.className)}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("py-4 pr-4 align-top", column.className)}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
