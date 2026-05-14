"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus2, FileText, Inbox } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { DataTable } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuoteDocument, QuoteRequest } from "@/types/api";
import { formatDate, formatDateTime, getName } from "@/lib/utils";
import {
  documentTypeLabel,
  formatMoney,
  statusLabel,
} from "@/lib/quote-documents";

const statuses = ["ALL", "DRAFT", "SENT", "ACCEPTED", "REJECTED"] as const;
const tabs = ["created", "requests"] as const;

export default function QuotesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("ALL");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("created");
  const [message, setMessage] = useState<string | null>(null);

  const listState = useApiData<QuoteDocument[]>(
    () => api.get<QuoteDocument[]>("/admin/quotes"),
    [],
  );
  const requestState = useApiData<QuoteRequest[]>(
    () => api.get<QuoteRequest[]>("/admin/quote-requests"),
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

  const filteredRequests = useMemo(() => {
    const records = requestState.data ?? [];
    return records.filter((request) => {
      const haystack = [
        getName(request.customer ?? undefined),
        request.customer?.email,
        request.customer?.phone,
        request.service?.name,
        request.postcode,
        request.details,
        request.createdQuote?.quoteNumber,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query.toLowerCase());
    });
  }, [query, requestState.data]);

  async function sendQuote(quote: QuoteDocument) {
    setMessage(null);
    try {
      const sent = await api.post<QuoteDocument>(
        `/admin/quotes/${quote.id}/send`,
        {},
      );
      listState.setData((current) =>
        (current ?? []).map((item) => (item.id === sent.id ? sent : item)),
      );
      setMessage(`Quote ${sent.quoteNumber} sent to ${sent.customerEmail}.`);
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to send quote",
      );
    }
  }

  if (listState.isLoading) return <LoadingSpinner label="Loading quotes..." />;
  if (listState.error || !listState.data) {
    return <ErrorState description={listState.error ?? "Unable to load quotes"} />;
  }

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

      {message ? (
        <div className="rounded-xl border border-primary/20 bg-secondary p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activeTab === "created" ? "default" : "outline"}
              onClick={() => setActiveTab("created")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Created Quotes
            </Button>
            <Button
              type="button"
              variant={activeTab === "requests" ? "default" : "outline"}
              onClick={() => setActiveTab("requests")}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Website Requests
            </Button>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              activeTab === "created"
                ? "Search by customer, email, quote number, or service"
                : "Search website requests by customer, email, service, address, or linked quote"
            }
          />
            {activeTab === "created" ? (
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
            ) : null}
          </div>
        </CardContent>
      </Card>

      {activeTab === "created" ? (
        <DataTable
          title="Created Quotes"
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
              key: "service",
              title: "Service",
              render: (row) => row.lineItems?.[0]?.serviceName ?? "N/A",
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
              key: "status",
              title: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: "issueDate",
              title: "Issue",
              render: (row) => formatDate(row.issueDate),
            },
            {
              key: "expiryDate",
              title: "Expiry",
              render: (row) => formatDate(row.expiryDate),
            },
            {
              key: "createdAt",
              title: "Created",
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/quotes/${row.id}`}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    View
                  </Link>
                  {row.status === "DRAFT" ? (
                    <Link
                      href={`/quotes/${row.id}`}
                      className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      Edit
                    </Link>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void sendQuote(row)}
                    disabled={!row.customerEmail}
                  >
                    Send
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : requestState.error ? (
        <ErrorState description={requestState.error} />
      ) : requestState.isLoading ? (
        <LoadingSpinner label="Loading website requests..." />
      ) : (
        <DataTable
          title="Website Requests"
          data={filteredRequests}
          emptyTitle="No website quote requests"
          emptyDescription="Public quote form submissions will appear here so staff can convert them into formal quotes."
          columns={[
            {
              key: "customer",
              title: "Customer",
              render: (row) => (
                <div>
                  <p className="font-medium">{getName(row.customer ?? undefined)}</p>
                  <p className="text-xs text-slate-500">
                    {row.customer?.email ?? "No email"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.customer?.phone ?? "No phone"}
                  </p>
                </div>
              ),
            },
            {
              key: "service",
              title: "Requested service",
              render: (row) => row.service?.name ?? "Unknown",
            },
            {
              key: "requestedDate",
              title: "Requested date",
              render: (row) => formatDate(row.preferredDate),
            },
            {
              key: "address",
              title: "Service address",
              render: (row) => row.postcode ?? "N/A",
            },
            {
              key: "submitted",
              title: "Submitted",
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              key: "status",
              title: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            {
              key: "quote",
              title: "Linked quote",
              render: (row) =>
                row.createdQuote ? (
                  <div>
                    <p className="font-semibold text-primary">Quote created</p>
                    <p className="text-xs text-slate-500">
                      {row.createdQuote.quoteNumber}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-500">Not created</span>
                ),
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/quotes/requests/${row.id}`}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                  >
                    View Request
                  </Link>
                  {row.createdQuote ? (
                    <Link
                      href={`/quotes/${row.createdQuote.id}`}
                      className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      View Quote
                    </Link>
                  ) : (
                    <Link
                      href={`/quotes/new?requestId=${row.id}`}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                    >
                      Create Quote
                    </Link>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
