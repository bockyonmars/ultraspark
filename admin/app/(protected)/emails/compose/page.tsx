"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck, Send } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ManualEmailRequest, ManualEmailResponse } from "@/types/api";

function buildPlainText(message: string) {
  return message
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function textToHtml(message: string) {
  return message
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${paragraph
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export default function ComposeEmailPage() {
  const searchParams = useSearchParams();
  const [recipientEmail, setRecipientEmail] = useState(
    searchParams.get("recipientEmail") ?? "",
  );
  const [recipientName, setRecipientName] = useState(
    searchParams.get("recipientName") ?? "",
  );
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [message, setMessage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relatedIds = useMemo(
    () => ({
      relatedTicketId: searchParams.get("relatedTicketId") ?? undefined,
      relatedCustomerId: searchParams.get("relatedCustomerId") ?? undefined,
      relatedContactMessageId:
        searchParams.get("relatedContactMessageId") ?? undefined,
      relatedQuoteId: searchParams.get("relatedQuoteId") ?? undefined,
      relatedBookingId: searchParams.get("relatedBookingId") ?? undefined,
    }),
    [searchParams],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);
    setIsSending(true);

    try {
      const payload: ManualEmailRequest = {
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName.trim() || undefined,
        subject: subject.trim(),
        messageHtml: textToHtml(message),
        plainText: buildPlainText(message),
        ctaLabel: ctaLabel.trim() || undefined,
        ctaUrl: ctaUrl.trim() || undefined,
        ...relatedIds,
      };

      await api.post<ManualEmailResponse>("/emails/manual", payload);
      setResult(`Email sent to ${payload.recipientEmail}.`);
      setMessage("");
      setCtaLabel("");
      setCtaUrl("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send email. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Emails</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          Compose branded customer email
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Send an UltraSpark-branded follow-up for tickets, complaints,
          bookings, quotes, or general customer support.
        </p>
      </div>

      {result ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {result}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Recipient email</span>
                  <Input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    placeholder="customer@example.com"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Recipient name</span>
                  <Input
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    placeholder="Customer name"
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-sm font-medium">Subject</span>
                <Input
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Follow-up from UltraSpark Cleaning"
                />
              </label>

              <label className="space-y-2 block">
                <span className="text-sm font-medium">Message body</span>
                <Textarea
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Write your customer-facing message here..."
                  className="min-h-[220px]"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium">
                    Optional CTA label
                  </span>
                  <Input
                    value={ctaLabel}
                    onChange={(event) => setCtaLabel(event.target.value)}
                    placeholder="Book another clean"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium">Optional CTA URL</span>
                  <Input
                    type="url"
                    value={ctaUrl}
                    onChange={(event) => setCtaUrl(event.target.value)}
                    placeholder="https://ultrasparkcleaning.co.uk/booking"
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className="w-full sm:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-primary">
                <MailCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Preview</p>
                <p className="text-xs text-slate-500">
                  Branded email content before sending.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                To
              </p>
              <p className="mt-1 break-words text-sm font-medium">
                {recipientName || "Customer"} &lt;
                {recipientEmail || "customer@example.com"}&gt;
              </p>
              <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">
                Subject
              </p>
              <p className="mt-1 break-words text-sm font-medium">
                {subject || "Follow-up from UltraSpark Cleaning"}
              </p>
              <div className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                <p className="font-semibold text-slate-950">
                  Hi {recipientName || "there"},
                </p>
                <p className="mt-3 whitespace-pre-wrap">
                  {message || "Your message preview will appear here."}
                </p>
                {ctaLabel && ctaUrl ? (
                  <p className="mt-4 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-white">
                    {ctaLabel}
                  </p>
                ) : null}
                <p className="mt-4 text-slate-600">
                  Kind regards,
                  <br />
                  The UltraSpark Cleaning team
                </p>
              </div>
            </div>

            {Object.values(relatedIds).some(Boolean) ? (
              <div className="rounded-2xl border p-4 text-xs text-slate-500">
                Related context attached to this email.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
