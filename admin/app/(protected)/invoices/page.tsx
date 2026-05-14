"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Invoice, InvoiceStatus } from "@/types/api";
import {
  formatDate,
  formatInvoiceMoney,
  formatInvoiceStatus,
  invoiceStatusOptions,
} from "@/lib/invoices";
import { formatDateTime, getName } from "@/lib/utils";

const statuses = ["ALL", ...invoiceStatusOptions()] as const;

export default function InvoicesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("ALL");
  const [message, setMessage] = useState<string | null>(null);

  const listState = useApiData<Invoice[]>(
    () => api.get<Invoice[]>("/admin/invoices"),
    [],
  );

  const filtered = useMemo(() => {
    const records = listState.data ?? [];
    return records.filter((invoice) => {
      const haystack = [
        invoice.invoiceNumber,
        invoice.customer?.firstName,
        invoice.customer?.lastName,
        invoice.customer?.email,
        invoice.quote?.quoteNumber,
        invoice.booking?.service?.name,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || invoice.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [listState.data, query, statusFilter]);

  async function markPaid(invoice: Invoice) {
    setMessage(null);
    try {
      const updated = await api.post<Invoice>(
        `/admin/invoices/${invoice.id}/mark-paid`,
        {},
      );
      listState.setData((current) =>
        (current ?? []).map((item) => (item.id === updated.id ? updated : item)),
      );
      setMessage(`${updated.invoiceNumber} marked as paid.`);
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to mark invoice paid",
      );
    }
  }

  if (listState.isLoading) return <LoadingSpinner label="Loading invoices..." />;
  if (listState.error || !listState.data) {
    return <ErrorState description={listState.error ?? "Unable to load invoices"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500">
            Store invoice records, PDFs, payment links, email history, and follow-up status.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Create invoice
        </Link>
      </div>

      {message ? (
        <div className="rounded-xl border border-primary/20 bg-secondary p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by invoice number, customer, email, quote, or booking"
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
                {status === "ALL" ? "All statuses" : formatInvoiceStatus(status)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <DataTable
        title="Invoice records"
        data={filtered}
        emptyTitle="No invoices"
        emptyDescription="Create an invoice record, upload a PDF, then send it from the admin portal."
        columns={[
          {
            key: "invoice",
            title: "Invoice",
            render: (row) => (
              <Link href={`/invoices/${row.id}`} className="block">
                <p className="font-semibold text-primary">{row.invoiceNumber}</p>
                <p className="text-xs text-slate-500">
                  {row.pdfFileName ? "PDF uploaded" : "No PDF"}
                </p>
              </Link>
            ),
          },
          {
            key: "customer",
            title: "Customer",
            render: (row) => (
              <div>
                <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                <p className="text-xs text-slate-500">
                  {row.customer?.email ?? "No email"}
                </p>
              </div>
            ),
          },
          {
            key: "linked",
            title: "Linked work",
            render: (row) =>
              row.booking?.service?.name ?? row.quote?.quoteNumber ?? "N/A",
          },
          {
            key: "amount",
            title: "Amount",
            className: "text-right",
            render: (row) => (
              <span className="font-semibold">{formatInvoiceMoney(row)}</span>
            ),
          },
          {
            key: "status",
            title: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "due",
            title: "Due date",
            render: (row) => formatDate(row.dueDate),
          },
          {
            key: "created",
            title: "Created",
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            key: "actions",
            title: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/invoices/${row.id}`}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                >
                  View
                </Link>
                {row.status !== "PAID" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void markPaid(row)}
                  >
                    Mark paid
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
