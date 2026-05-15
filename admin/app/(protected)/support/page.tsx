"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useApiData } from "@/lib/use-api-data";
import { DataTable } from "@/components/shared/data-table";
import { DetailsDrawer } from "@/components/shared/details-drawer";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateSupportTicketRequest,
  SupportTicket,
  SupportTicketActivity,
  SupportTicketMessage,
} from "@/types/api";
import { formatDateTime, toTitleCase } from "@/lib/utils";

const statuses = [
  "ALL",
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_ON_CUSTOMER",
  "RESOLVED",
  "CLOSED",
  "ARCHIVED",
] as const;

const priorities = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const categories = [
  "ALL",
  "GENERAL_ENQUIRY",
  "COMPLAINT",
  "BOOKING_ISSUE",
  "PAYMENT_ISSUE",
  "CLEANING_QUALITY",
  "STAFF_ISSUE",
  "RESCHEDULE_REQUEST",
  "CANCELLATION_REQUEST",
  "OTHER",
] as const;

type CreateTicketFormValues = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  description: string;
  category: SupportTicket["category"];
  priority: NonNullable<SupportTicket["priority"]>;
  status: NonNullable<SupportTicket["status"]>;
  assignedToAdminId: string;
};

type CreateTicketErrors = Partial<
  Record<
    "customerName" | "customerEmail" | "subject" | "description" | "form",
    string
  >
>;

const initialCreateTicketValues: CreateTicketFormValues = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  subject: "",
  description: "",
  category: "GENERAL_ENQUIRY",
  priority: "MEDIUM",
  status: "NEW",
  assignedToAdminId: "",
};

function validateCreateTicket(values: CreateTicketFormValues) {
  const errors: CreateTicketErrors = {};
  const customerName = values.customerName.trim();
  const customerEmail = values.customerEmail.trim();
  const subject = values.subject.trim();
  const description = values.description.trim();

  if (!customerName) errors.customerName = "Name is required.";
  if (!customerEmail) {
    errors.customerEmail = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    errors.customerEmail = "Enter a valid email address.";
  }
  if (!subject) errors.subject = "Subject is required.";
  if (!description) errors.description = "Message is required.";

  return errors;
}

function getAdminName(
  admin?:
    | SupportTicketMessage["authorAdmin"]
    | SupportTicketActivity["adminUser"],
) {
  if (!admin) return "Admin";
  const fullName = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim();
  return fullName || admin.email || "Admin";
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{error}</p>;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string | null;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {toTitleCase(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SupportPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("ALL");
  const [priorityFilter, setPriorityFilter] =
    useState<(typeof priorities)[number]>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof categories)[number]>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [messageRefresh, setMessageRefresh] = useState(0);
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [assignmentAdminId, setAssignmentAdminId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<CreateTicketFormValues>(
    initialCreateTicketValues,
  );
  const [createErrors, setCreateErrors] = useState<CreateTicketErrors>({});
  const [createSuccessMessage, setCreateSuccessMessage] = useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);

  const listState = useApiData<SupportTicket[]>(
    () => api.get<SupportTicket[]>("/support/tickets"),
    [],
  );
  const detailState = useApiData<SupportTicket | null>(
    () =>
      selectedId
        ? api.get<SupportTicket>(`/support/tickets/${selectedId}`)
        : Promise.resolve(null),
    [selectedId],
    null,
  );
  const messagesState = useApiData<SupportTicketMessage[]>(
    () =>
      selectedId
        ? api.get<SupportTicketMessage[]>(
            `/support/tickets/${selectedId}/messages`,
          )
        : Promise.resolve([]),
    [selectedId, messageRefresh],
    [],
  );
  const activityState = useApiData<SupportTicketActivity[]>(
    () =>
      selectedId
        ? api.get<SupportTicketActivity[]>(
            `/support/tickets/${selectedId}/activity`,
          )
        : Promise.resolve([]),
    [selectedId, activityRefresh],
    [],
  );

  useEffect(() => {
    setAssignmentAdminId(detailState.data?.assignedToAdminId ?? "");
    setReplyMessage("");
    setInternalNote("");
  }, [detailState.data?.id, detailState.data?.assignedToAdminId]);

  const filtered = useMemo(() => {
    const records = listState.data ?? [];
    return records.filter((ticket) => {
      const haystack = [
        ticket.ticketNumber,
        ticket.customerName,
        ticket.customerEmail,
        ticket.customerPhone,
        ticket.subject,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "ALL" || ticket.category === categoryFilter;
      return (
        matchesQuery && matchesStatus && matchesPriority && matchesCategory
      );
    });
  }, [listState.data, query, statusFilter, priorityFilter, categoryFilter]);

  async function updateTicket(id: string, payload: Partial<SupportTicket>) {
    const updated = await api.patch<SupportTicket>(
      `/support/tickets/${id}`,
      payload,
    );
    listState.setData((current) =>
      (current ?? []).map((ticket) => (ticket.id === id ? updated : ticket)),
    );
    detailState.setData((current) =>
      current ? { ...current, ...updated } : updated,
    );
    setActivityRefresh((current) => current + 1);
  }

  async function updateStatus(id: string, status: string) {
    const updated = await api.patch<SupportTicket>(
      `/support/tickets/${id}/status`,
      { status },
    );
    listState.setData((current) =>
      (current ?? []).map((ticket) => (ticket.id === id ? updated : ticket)),
    );
    detailState.setData((current) =>
      current ? { ...current, ...updated } : updated,
    );
    setActivityRefresh((current) => current + 1);
  }

  async function assignTicket(id: string) {
    const assignedToAdminId = assignmentAdminId.trim() || null;
    const updated = await api.patch<SupportTicket>(
      `/support/tickets/${id}/assign`,
      {
        assignedToAdminId,
      },
    );
    listState.setData((current) =>
      (current ?? []).map((ticket) => (ticket.id === id ? updated : ticket)),
    );
    detailState.setData((current) =>
      current ? { ...current, ...updated } : updated,
    );
    setActivityRefresh((current) => current + 1);
  }

  async function addMessage(
    id: string,
    type: "INTERNAL_NOTE" | "CUSTOMER_REPLY",
    message: string,
  ) {
    const trimmed = message.trim();
    if (!trimmed) return;

    await api.post<SupportTicketMessage>(`/support/tickets/${id}/messages`, {
      type,
      message: trimmed,
    });
    if (type === "CUSTOMER_REPLY") setReplyMessage("");
    if (type === "INTERNAL_NOTE") setInternalNote("");
    setMessageRefresh((current) => current + 1);
    setActivityRefresh((current) => current + 1);
  }

  function openCreateDrawer() {
    setSelectedId(null);
    setCreateValues(initialCreateTicketValues);
    setCreateErrors({});
    setCreateSuccessMessage(null);
    setIsCreateOpen(true);
  }

  function updateCreateValue(
    field: keyof CreateTicketFormValues,
    value: string,
  ) {
    setCreateValues((current) => ({ ...current, [field]: value }));
    setCreateErrors((current) => {
      if (!current[field as keyof CreateTicketErrors] && !current.form) {
        return current;
      }
      const next = { ...current };
      delete next[field as keyof CreateTicketErrors];
      delete next.form;
      return next;
    });
  }

  async function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;

    const nextErrors = validateCreateTicket(createValues);
    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors);
      return;
    }

    const payload: CreateSupportTicketRequest = {
      customerName: createValues.customerName.trim(),
      customerEmail: createValues.customerEmail.trim().toLowerCase(),
      customerPhone: createValues.customerPhone.trim() || undefined,
      subject: createValues.subject.trim(),
      description: createValues.description.trim(),
      category: createValues.category,
      priority: createValues.priority,
      status: createValues.status,
      source: "manual_admin",
      assignedToAdminId: createValues.assignedToAdminId.trim() || undefined,
    };

    setIsCreating(true);
    setCreateErrors({});

    try {
      const created = await api.post<SupportTicket>(
        "/support/tickets/admin",
        payload,
      );
      listState.setData((current) => [
        created,
        ...(current ?? []).filter((ticket) => ticket.id !== created.id),
      ]);
      setCreateValues(initialCreateTicketValues);
      setCreateSuccessMessage(`Ticket ${created.ticketNumber} created.`);
      setIsCreateOpen(false);
      setSelectedId(created.id);
    } catch (error) {
      setCreateErrors({
        form:
          error instanceof Error
            ? error.message
            : "Unable to create support ticket. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  }

  if (listState.isLoading)
    return <LoadingSpinner label="Loading support tickets..." />;
  if (listState.error || !listState.data) {
    return (
      <ErrorState
        description={listState.error ?? "Unable to load support tickets"}
      />
    );
  }

  const selected = detailState.data;
  const messages = messagesState.data ?? [];
  const activity = activityState.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Support</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Support tickets
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Review customer support cases, update status, assign ownership, and
            create manual tickets for admin-led follow-up.
          </p>
        </div>
        <Button onClick={openCreateDrawer} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {createSuccessMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {createSuccessMessage}
        </div>
      ) : null}

      <Card>
        <CardContent className="grid gap-4 pt-6 lg:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search ticket, customer, email, phone, or subject"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as (typeof statuses)[number])
            }
            className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : toTitleCase(status)}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value as (typeof priorities)[number],
              )
            }
            className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority === "ALL" ? "All priorities" : toTitleCase(priority)}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value as (typeof categories)[number],
              )
            }
            className="h-10 w-full rounded-xl border bg-white px-3 text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "ALL" ? "All categories" : toTitleCase(category)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <DataTable
        title="Support tickets"
        data={filtered}
        emptyTitle="No support tickets"
        emptyDescription="Customer support cases will appear here when they are submitted."
        columns={[
          {
            key: "ticket",
            title: "Ticket",
            render: (row) => (
              <button
                className="text-left"
                onClick={() => setSelectedId(row.id)}
              >
                <p className="font-medium text-primary">{row.ticketNumber}</p>
                <p className="max-w-xs truncate text-xs text-slate-500">
                  {row.subject}
                </p>
              </button>
            ),
          },
          {
            key: "customer",
            title: "Customer",
            render: (row) => (
              <div>
                <p className="font-medium">{row.customerName}</p>
                <p className="text-xs text-slate-500">
                  {row.customerEmail ?? row.customerPhone ?? "No contact"}
                </p>
              </div>
            ),
          },
          {
            key: "category",
            title: "Category",
            render: (row) => toTitleCase(row.category),
          },
          {
            key: "priority",
            title: "Priority",
            render: (row) => <StatusBadge status={row.priority} />,
          },
          {
            key: "status",
            title: "Status",
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: "source",
            title: "Source",
            render: (row) => toTitleCase(row.source),
          },
          {
            key: "assigned",
            title: "Assigned",
            render: (row) => getAdminName(row.assignedToAdmin),
          },
          {
            key: "updated",
            title: "Updated",
            render: (row) => formatDateTime(row.updatedAt),
          },
        ]}
      />

      <DetailsDrawer
        open={isCreateOpen}
        title="Create support ticket"
        description="Add a manual customer support case from the admin panel"
        onClose={() => {
          if (!isCreating) setIsCreateOpen(false);
        }}
      >
        <form className="space-y-5" onSubmit={createTicket} noValidate>
          {createErrors.form ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {createErrors.form}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Customer name</span>
              <Input
                value={createValues.customerName}
                onChange={(event) =>
                  updateCreateValue("customerName", event.target.value)
                }
                placeholder="Sarah Johnson"
                aria-invalid={Boolean(createErrors.customerName)}
              />
              <FieldError error={createErrors.customerName} />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Customer email</span>
              <Input
                type="email"
                value={createValues.customerEmail}
                onChange={(event) =>
                  updateCreateValue("customerEmail", event.target.value)
                }
                placeholder="customer@example.com"
                aria-invalid={Boolean(createErrors.customerEmail)}
              />
              <FieldError error={createErrors.customerEmail} />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Phone</span>
            <Input
              type="tel"
              value={createValues.customerPhone}
              onChange={(event) =>
                updateCreateValue("customerPhone", event.target.value)
              }
              placeholder="+44..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Subject</span>
            <Input
              value={createValues.subject}
              onChange={(event) =>
                updateCreateValue("subject", event.target.value)
              }
              placeholder="Cleaning follow-up needed"
              aria-invalid={Boolean(createErrors.subject)}
            />
            <FieldError error={createErrors.subject} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Message</span>
            <Textarea
              value={createValues.description}
              onChange={(event) =>
                updateCreateValue("description", event.target.value)
              }
              placeholder="Describe the customer issue or request"
              aria-invalid={Boolean(createErrors.description)}
              className="min-h-[180px]"
            />
            <FieldError error={createErrors.description} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Category"
              value={createValues.category}
              options={categories.filter((category) => category !== "ALL")}
              onChange={(value) => updateCreateValue("category", value)}
            />
            <SelectField
              label="Priority"
              value={createValues.priority}
              options={priorities.filter((priority) => priority !== "ALL")}
              onChange={(value) => updateCreateValue("priority", value)}
            />
            <SelectField
              label="Status"
              value={createValues.status}
              options={statuses.filter((status) => status !== "ALL")}
              onChange={(value) => updateCreateValue("status", value)}
            />
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Assigned admin ID</span>
            <Input
              value={createValues.assignedToAdminId}
              onChange={(event) =>
                updateCreateValue("assignedToAdminId", event.target.value)
              }
              placeholder="Optional admin user ID"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full sm:w-auto"
            >
              {isCreating ? "Creating..." : "Create ticket"}
            </Button>
          </div>
        </form>
      </DetailsDrawer>

      <DetailsDrawer
        open={Boolean(selectedId)}
        title={
          selected
            ? `${selected.ticketNumber}: ${selected.subject}`
            : "Support ticket"
        }
        description={
          selected
            ? `${selected.customerName} · ${toTitleCase(selected.status)}`
            : "Loading ticket"
        }
        onClose={() => setSelectedId(null)}
      >
        {detailState.isLoading && selectedId ? (
          <LoadingSpinner label="Loading support ticket..." />
        ) : null}
        {selected ? (
          <>
            <div className="grid gap-4 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Customer
                </p>
                <p className="mt-1 text-sm">{selected.customerName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Email
                </p>
                <p className="mt-1 text-sm">
                  {selected.customerEmail ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Phone
                </p>
                <p className="mt-1 text-sm">
                  {selected.customerPhone ?? "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Source
                </p>
                <p className="mt-1 text-sm">{toTitleCase(selected.source)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Created
                </p>
                <p className="mt-1 text-sm">
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Updated
                </p>
                <p className="mt-1 text-sm">
                  {formatDateTime(selected.updatedAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Description
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selected.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField
                label="Status"
                value={selected.status}
                options={statuses.filter((status) => status !== "ALL")}
                onChange={(status) => void updateStatus(selected.id, status)}
              />
              <SelectField
                label="Priority"
                value={selected.priority}
                options={priorities.filter((priority) => priority !== "ALL")}
                onChange={(priority) =>
                  void updateTicket(selected.id, { priority })
                }
              />
              <SelectField
                label="Category"
                value={selected.category}
                options={categories.filter((category) => category !== "ALL")}
                onChange={(category) =>
                  void updateTicket(selected.id, { category })
                }
              />
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Assignment
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={assignmentAdminId}
                  onChange={(event) => setAssignmentAdminId(event.target.value)}
                  placeholder="Admin user ID, or blank to unassign"
                />
                <Button
                  onClick={() => void assignTicket(selected.id)}
                  className="w-full sm:w-auto"
                >
                  Save
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Assigned to {getAdminName(selected.assignedToAdmin)}
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Related booking
                </p>
                <p className="mt-1 text-sm">
                  {selected.relatedBookingId ?? "None linked"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Related quote
                </p>
                <p className="mt-1 text-sm">
                  {selected.relatedQuoteId ?? "None linked"}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <p className="text-sm font-semibold">Related invoices</p>
              {(selected.invoices ?? []).length ? (
                <ul className="space-y-2 text-sm">
                  {selected.invoices?.map((invoice) => (
                    <li
                      key={invoice.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <span>{invoice.invoiceNumber}</span>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-semibold text-primary"
                      >
                        View invoice
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No invoices linked.</p>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Customer thread</p>
                <StatusBadge status={selected.status} />
              </div>
              {messagesState.isLoading ? (
                <LoadingSpinner label="Loading messages..." />
              ) : null}
              <div className="space-y-3">
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.type === "INTERNAL_NOTE"
                          ? "rounded-xl bg-amber-50 p-3 text-sm"
                          : "rounded-xl bg-emerald-50 p-3 text-sm"
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {toTitleCase(message.type)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        By {getAdminName(message.authorAdmin)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
                        {message.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No messages or notes yet.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    Branded email follow-up
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Open the compose page with this ticket and customer
                    prefilled.
                  </p>
                </div>
                <Link
                  href={`/emails/compose?recipientEmail=${encodeURIComponent(
                    selected.customerEmail ?? "",
                  )}&recipientName=${encodeURIComponent(
                    selected.customerName ?? "",
                  )}&subject=${encodeURIComponent(
                    `Re: ${selected.subject}`,
                  )}&relatedTicketId=${encodeURIComponent(
                    selected.id,
                  )}&relatedCustomerId=${encodeURIComponent(
                    selected.customerId ?? "",
                  )}`}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  Compose email
                </Link>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <p className="text-sm font-semibold">Send customer reply</p>
              <Textarea
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                placeholder="Write a customer-facing reply"
              />
              <Button
                onClick={() =>
                  void addMessage(selected.id, "CUSTOMER_REPLY", replyMessage)
                }
                className="w-full sm:w-auto"
              >
                Send reply
              </Button>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <p className="text-sm font-semibold">Internal note</p>
              <Textarea
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                placeholder="Add an internal note for admins"
              />
              <Button
                variant="outline"
                onClick={() =>
                  void addMessage(selected.id, "INTERNAL_NOTE", internalNote)
                }
                className="w-full sm:w-auto"
              >
                Add note
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Quick actions
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={
                    selected.status === "RESOLVED" ? "default" : "outline"
                  }
                  onClick={() => void updateStatus(selected.id, "RESOLVED")}
                >
                  Mark resolved
                </Button>
                <Button
                  variant={selected.status === "CLOSED" ? "default" : "outline"}
                  onClick={() => void updateStatus(selected.id, "CLOSED")}
                >
                  Mark closed
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border p-4">
              <p className="text-sm font-semibold">Activity timeline</p>
              {activityState.isLoading ? (
                <LoadingSpinner label="Loading activity..." />
              ) : null}
              <div className="space-y-3">
                {activity.length ? (
                  activity.map((item) => (
                    <div
                      key={item.id}
                      className="border-l-2 border-primary/30 pl-3"
                    >
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(item.createdAt)} ·{" "}
                        {getAdminName(item.adminUser)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No activity recorded yet.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DetailsDrawer>
    </div>
  );
}
