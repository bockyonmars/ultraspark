"use client";

import Link from "next/link";
import { ArrowLeft, FilePlus2, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { formatDate, formatDateTime, getName } from "@/lib/utils";
import type { QuoteRequest } from "@/types/api";

export default function QuoteRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const detailState = useApiData<QuoteRequest>(
    () => api.get<QuoteRequest>(`/admin/quote-requests/${params.id}`),
    [params.id],
  );
  const [message, setMessage] = useState<string | null>(null);

  async function markReviewed() {
    setMessage(null);
    try {
      const updated = await api.patch<QuoteRequest>(
        `/admin/quote-requests/${params.id}/status`,
        { status: "CONTACTED" },
      );
      detailState.setData(updated);
      setMessage("Request marked as reviewed.");
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Unable to mark reviewed",
      );
    }
  }

  if (detailState.isLoading) {
    return <LoadingSpinner label="Loading quote request..." />;
  }

  if (detailState.error || !detailState.data) {
    return (
      <ErrorState
        description={detailState.error ?? "Unable to load quote request"}
      />
    );
  }

  const request = detailState.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/quotes"
            className="mb-2 inline-flex items-center text-sm font-semibold text-slate-600 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to quotes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Website quote request
          </h1>
          <p className="text-sm text-slate-500">
            Submitted {formatDateTime(request.createdAt)}
          </p>
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
          {request.createdQuote ? (
            <Link
              href={`/quotes/${request.createdQuote.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 sm:w-auto"
            >
              View Quote
            </Link>
          ) : (
            <Link
              href={`/quotes/new?requestId=${request.id}`}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 sm:w-auto"
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Create Quote
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void markReviewed()}
            className="w-full sm:w-auto"
          >
            Mark reviewed
          </Button>
          <Link
            href="/support"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-muted sm:w-auto"
          >
            <LifeBuoy className="mr-2 h-4 w-4" />
            Support
          </Link>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-primary/20 bg-secondary p-4 text-sm text-primary">
          {message}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Customer"
          value={getName(request.customer ?? undefined)}
        />
        <SummaryCard
          label="Service"
          value={request.service?.name ?? "Unknown"}
        />
        <SummaryCard
          label="Requested date"
          value={formatDate(request.preferredDate)}
        />
        <div className="rounded-xl border bg-white p-4 shadow-soft">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Status
          </p>
          <div className="mt-2">
            <StatusBadge status={request.status} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">
              Request details
            </h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <Detail label="Customer email" value={request.customer?.email} />
              <Detail label="Customer phone" value={request.customer?.phone} />
              <Detail label="Service address" value={request.postcode} />
              <Detail label="Property type" value={request.propertyType} />
              <Detail
                label="Bedrooms"
                value={
                  request.bedrooms !== null && request.bedrooms !== undefined
                    ? String(request.bedrooms)
                    : undefined
                }
              />
              <Detail
                label="Bathrooms"
                value={
                  request.bathrooms !== null && request.bathrooms !== undefined
                    ? String(request.bathrooms)
                    : undefined
                }
              />
            </dl>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Message and special instructions
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {request.details ?? "No additional details supplied."}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">
              Email history
            </h2>
            <div className="mt-4 space-y-3">
              {request.emailLogs?.length ? (
                request.emailLogs.map((email) => (
                  <div key={email.id} className="rounded-xl border p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{email.subject}</p>
                        <p className="text-slate-500">To {email.recipient}</p>
                      </div>
                      <StatusBadge status={email.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(email.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                  No request emails logged yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">
              Linked quote
            </h2>
            {request.createdQuote ? (
              <div className="mt-4 space-y-3">
                <StatusBadge status="QUOTED" />
                <p className="font-semibold text-primary">
                  {request.createdQuote.quoteNumber}
                </p>
                <Link
                  href={`/quotes/${request.createdQuote.id}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-muted sm:w-auto"
                >
                  View Quote
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-500">
                  No formal quote has been created from this request yet.
                </p>
                <Link
                  href={`/quotes/new?requestId=${request.id}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 sm:w-auto"
                >
                  Create Quote
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Source</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Form type" value="Website quote request" />
              <Detail label="Request ID" value={request.id} />
              <Detail
                label="Submitted"
                value={formatDateTime(request.createdAt)}
              />
              <Detail
                label="Updated"
                value={formatDateTime(request.updatedAt)}
              />
            </dl>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-slate-800">
        {value || "N/A"}
      </dd>
    </div>
  );
}
