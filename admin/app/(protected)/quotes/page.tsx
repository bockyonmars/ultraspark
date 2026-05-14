"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { QuoteDocument, QuoteRequest } from "@/types/api";
import { formatDate, formatDateTime, getName } from "@/lib/utils";
import {
  documentTypeLabel,
  formatMoney,
  statusLabel,
} from "@/lib/quote-documents";

const statuses = ["ALL", "DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;

export default function QuotesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("ALL");

  const listState = useApiData<QuoteDocument[]>(
    () => api.get<QuoteDocument[]>("/admin/quotes"),
    [],
  );
  const requestState = useApiData<QuoteRequest[]>(
    () => api.get<QuoteRequest[]>("/quotes"),
    [],
    [],
  );

  const filtered = useMemo(() => {
    const records = listState.data ?? [];
    return records.filter((item) => {
      const haystack = [
        item.quoteNumber,
        item.customerName,
        item.customerEmail,
        item.customerPhone,
        item.lineItems.map((lineItem) => lineItem.serviceName).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [listState.data, query, statusFilter]);

  if (listState.isLoading) return <LoadingSpinner label="Loading quotes..." />;
  if (listState.error || !listState.data) {
    return <ErrorState description={listState.error ?? "Unable to load quotes"} />;
  }

  const recentRequests = (requestState.data ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quotes / Estimates
          </h1>
          <p className="text-sm text-slate-500">
            Create, preview, print, and send branded UltraSpark quote documents.
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Create Quote
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by customer, email, quote number, or service"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as (typeof statuses)[number])
            }
            className="h-10 rounded-xl border bg-white px-3 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : statusLabel(status)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <DataTable
        title="Quote documents"
        data={filtered}
        emptyTitle="No quote documents"
        emptyDescription="Create a quote or estimate to start building reusable customer documents."
        columns={[
          {
            key: "quote",
            title: "Quote",
            render: (row) => (
              <Link href={`/quotes/${row.id}`} className="block text-left">
                <p className="font-semibold text-primary">{row.quoteNumber}</p>
                <p className="text-xs text-slate-500">
                  {documentTypeLabel(row.documentType)}
                </p>
              </Link>
            ),
          },
          {
            key: "customer",
            title: "Customer",
            render: (row) => (
              <div>
                <p className="font-medium">{row.customerName}</p>
                <p className="text-xs text-slate-500">{row.customerEmail}</p>
              </div>
            ),
          },
          {
            key: "issueDate",
            title: "Issue date",
            render: (row) => formatDate(row.issueDate),
          },
          {
            key: "status",
            title: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "total",
            title: "Total",
            className: "text-right",
            render: (row) => (
              <span className="font-semibold">{formatMoney(row.total)}</span>
            ),
          },
          {
            key: "updatedAt",
            title: "Updated",
            render: (row) => formatDateTime(row.updatedAt),
          },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent website quote requests
              </h2>
              <p className="text-sm text-slate-500">
                Public quote request forms still feed into the existing backend.
              </p>
            </div>
            {requestState.isLoading ? (
              <span className="text-sm text-slate-500">Loading...</span>
            ) : null}
          </div>
          {recentRequests.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Service</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((request) => (
                    <tr key={request.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {getName(request.customer ?? undefined)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {request.customer?.email ?? "No email"}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        {request.service?.name ?? "Unknown"}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="py-3 pr-4">
                        {formatDateTime(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No recent public quote requests found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
