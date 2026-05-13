import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { CONTACT, SERVICES, getServiceByTitle } from "@/lib/constants";
import { PublicFormError, submitPublicForm } from "@/lib/api";
import { trackBookingSubmitted, trackContactSubmitted, trackQuoteSubmitted } from "@/lib/analytics";

export type RequestKind = "quote" | "booking";

type FieldErrors = Record<string, string>;

type FormStatus = {
  message?: string;
  type?: "error" | "success";
};

const requestCopy: Record<
  RequestKind,
  {
    title: string;
    intro: string;
    button: string;
    source: string;
  }
> = {
  quote: {
    title: "Request a free quote",
    intro: "Tell us what you need and we will respond with availability and a tailored estimate.",
    button: "Request My Quote",
    source: "ultraspark-new-quote-form",
  },
  booking: {
    title: "Request a booking",
    intro:
      "Share your preferred cleaning slot and we will confirm availability before anything is final.",
    button: "Send Booking Request",
    source: "ultraspark-new-booking-form",
  },
};

const propertyTypes = ["House", "Flat / Apartment", "Office", "Airbnb / Short-let", "Other"];

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalNumber(value: string) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function required(errors: FieldErrors, field: string, value: string, label: string) {
  if (!value) errors[field] = `${label} is required.`;
}

function emailLooksValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createDetails(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join("\n");
}

type PublicFormResponse = {
  data?: {
    requestId?: string;
    id?: string;
  };
};

function getRequestId(response: PublicFormResponse) {
  return response?.data?.requestId ?? response?.data?.id;
}

export function BookingForm({ initialKind = "quote" }: { initialKind?: RequestKind }) {
  const navigate = useNavigate();
  const [kind, setKind] = useState<RequestKind>(initialKind);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>({});

  useEffect(() => {
    setKind(initialKind);
  }, [initialKind]);

  const copy = requestCopy[kind];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextErrors: FieldErrors = {};

    const fullName = asString(formData, "fullName");
    const phone = asString(formData, "phone");
    const email = asString(formData, "email");
    const selectedServiceTitle = asString(formData, "serviceType");
    const selectedService = getServiceByTitle(selectedServiceTitle);
    const address = asString(formData, "address");
    const postcode = asString(formData, "postcode");
    const propertyType = asString(formData, "propertyType");
    const preferredDate = asString(formData, "preferredDate");
    const preferredTime = asString(formData, "preferredTime");
    const bedrooms = asString(formData, "bedrooms");
    const bathrooms = asString(formData, "bathrooms");
    const additionalNotes = asString(formData, "additionalNotes");

    required(nextErrors, "fullName", fullName, "Full name");
    required(nextErrors, "phone", phone, "Phone number");
    required(nextErrors, "email", email, "Email address");
    required(nextErrors, "serviceType", selectedServiceTitle, "Service");
    required(nextErrors, "address", address, "Address");

    if (kind === "booking") {
      required(nextErrors, "preferredDate", preferredDate, "Preferred date");
      required(nextErrors, "preferredTime", preferredTime, "Preferred time");
    }

    if (email && !emailLooksValid(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({
        type: "error",
        message: "Please check the highlighted fields and try again.",
      });
      return;
    }

    const backendServiceType = selectedService?.backendServiceType ?? selectedServiceTitle;
    const details = createDetails([
      selectedServiceTitle ? `Selected service: ${selectedServiceTitle}` : undefined,
      selectedServiceTitle && selectedServiceTitle !== backendServiceType
        ? `Backend service mapping: ${backendServiceType}`
        : undefined,
      propertyType ? `Property type: ${propertyType}` : undefined,
      bedrooms ? `Bedrooms / rooms: ${bedrooms}` : undefined,
      bathrooms ? `Bathrooms: ${bathrooms}` : undefined,
      postcode ? `Postcode: ${postcode}` : undefined,
      additionalNotes ? `Additional notes: ${additionalNotes}` : undefined,
    ]);

    setSubmitting(true);
    setErrors({});
    setStatus({});

    try {
      const response =
        kind === "quote"
          ? await submitPublicForm<PublicFormResponse>("/quotes", {
              fullName,
              email,
              phone,
              serviceType: backendServiceType,
              address,
              propertyType,
              bedrooms: asOptionalNumber(bedrooms),
              bathrooms: asOptionalNumber(bathrooms),
              preferredDate: preferredDate || undefined,
              details: details || "Quote request submitted from UltraSpark new website.",
              additionalNotes,
              source: copy.source,
            })
          : await submitPublicForm<PublicFormResponse>("/bookings", {
              fullName,
              email,
              phone,
              serviceType: backendServiceType,
              preferredDate,
              preferredTime,
              address,
              postcode,
              propertyType,
              bedrooms: asOptionalNumber(bedrooms),
              bathrooms: asOptionalNumber(bathrooms),
              details: details || "Booking request submitted from UltraSpark new website.",
              additionalNotes,
              source: copy.source,
            });

      const requestId = getRequestId(response);
      if (kind === "quote") {
        trackQuoteSubmitted(requestId);
      } else {
        trackBookingSubmitted(requestId);
      }
      setStatus({
        type: "success",
        message: "Request sent. Taking you to the confirmation page...",
      });
      await navigate({ to: "/thank-you", search: { type: kind } });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof PublicFormError
            ? error.message
            : `We could not send your request just now. Please try again or contact us on WhatsApp at ${CONTACT.phoneDisplay}.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-card p-5 shadow-elegant sm:p-6 md:p-8"
    >
      <div className="mb-6">
        <div className="inline-flex rounded-full border bg-background p-1">
          {(["quote", "booking"] as RequestKind[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setKind(option);
                setErrors({});
                setStatus({});
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                kind === option
                  ? "bg-secondary text-secondary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {option === "quote" ? "Get Quote" : "Book Cleaning"}
            </button>
          ))}
        </div>
        <h2 className="mt-5 text-2xl font-bold text-primary">{copy.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.intro}</p>
      </div>

      <StatusMessage status={status} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Full Name"
          name="fullName"
          required
          error={errors.fullName}
          autoComplete="name"
        />
        <Field
          label="Phone Number"
          name="phone"
          type="tel"
          required
          error={errors.phone}
          autoComplete="tel"
        />
        <Field
          label="Email Address"
          name="email"
          type="email"
          required
          error={errors.email}
          autoComplete="email"
        />
        <Select
          label="Service Needed"
          name="serviceType"
          options={SERVICES.map((service) => service.title)}
          required
          error={errors.serviceType}
        />
        <Select
          label="Property Type"
          name="propertyType"
          options={propertyTypes}
          error={errors.propertyType}
        />
        <Field
          label="Bedrooms / Rooms"
          name="bedrooms"
          type="number"
          min="0"
          placeholder="e.g. 2"
          error={errors.bedrooms}
        />
        <Field
          label="Bathrooms"
          name="bathrooms"
          type="number"
          min="0"
          placeholder="e.g. 1"
          error={errors.bathrooms}
        />
        <Field
          label="Preferred Date"
          name="preferredDate"
          type="date"
          required={kind === "booking"}
          error={errors.preferredDate}
        />
        <Field
          label="Preferred Time"
          name="preferredTime"
          type="time"
          required={kind === "booking"}
          error={errors.preferredTime}
        />
        <Field
          label="Postcode"
          name="postcode"
          placeholder="e.g. SW1A 1AA"
          autoComplete="postal-code"
          error={errors.postcode}
        />
        <div className="md:col-span-2">
          <Field
            label="Address / Area"
            name="address"
            required
            placeholder="Street address or service area"
            autoComplete="street-address"
            error={errors.address}
          />
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          label="Additional Notes"
          name="additionalNotes"
          rows={4}
          placeholder="Anything we should know about access, timing, parking, pets, or cleaning priorities?"
          error={errors.additionalNotes}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-accent px-8 py-4 text-base font-semibold text-white shadow-soft transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Sending..." : copy.button}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        We respond within a few working hours, Monday to Saturday.
      </p>
    </form>
  );
}

export function ContactForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextErrors: FieldErrors = {};

    const fullName = asString(formData, "fullName");
    const email = asString(formData, "email");
    const phone = asString(formData, "phone");
    const subject = asString(formData, "subject");
    const message = asString(formData, "message");

    required(nextErrors, "fullName", fullName, "Full name");
    required(nextErrors, "email", email, "Email address");
    required(nextErrors, "message", message, "Message");

    if (email && !emailLooksValid(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus({
        type: "error",
        message: "Please check the highlighted fields and try again.",
      });
      return;
    }

    setSubmitting(true);
    setErrors({});
    setStatus({});

    try {
      const response = await submitPublicForm<PublicFormResponse>("/contact", {
        fullName,
        email,
        phone,
        subject: subject || "Website contact form",
        message,
        source: "ultraspark-new-contact-form",
      });

      trackContactSubmitted(getRequestId(response));
      setStatus({
        type: "success",
        message: "Message sent. Taking you to the confirmation page...",
      });
      await navigate({ to: "/thank-you", search: { type: "contact" } });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof PublicFormError
            ? error.message
            : `We could not send your message just now. Please try again or contact us on WhatsApp at ${CONTACT.phoneDisplay}.`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border bg-card p-5 shadow-elegant sm:p-6 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Send us a message</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Share your details and the UltraSpark team will get back to you quickly.
        </p>
      </div>

      <StatusMessage status={status} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Full Name"
          name="fullName"
          required
          error={errors.fullName}
          autoComplete="name"
        />
        <Field
          label="Phone Number"
          name="phone"
          type="tel"
          error={errors.phone}
          autoComplete="tel"
        />
        <Field
          label="Email Address"
          name="email"
          type="email"
          required
          error={errors.email}
          autoComplete="email"
        />
        <Field
          label="Subject"
          name="subject"
          placeholder="How can we help?"
          error={errors.subject}
        />
      </div>

      <div className="mt-4">
        <Textarea
          label="Message"
          name="message"
          rows={6}
          required
          placeholder="Tell us what you need help with."
          error={errors.message}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-accent px-8 py-4 text-base font-semibold text-white shadow-soft transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Sending..." : "Send Message"}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Prefer WhatsApp? Message us on {CONTACT.phoneDisplay}.
      </p>
    </form>
  );
}

function StatusMessage({ status }: { status: FormStatus }) {
  if (!status.message) return null;
  const isError = status.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
        isError
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-success/20 bg-success/10 text-success"
      }`}
      role={isError ? "alert" : "status"}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{status.message}</span>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  error,
  autoComplete,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor={name}>
        {label} {required && <span className="text-secondary">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={200}
        autoComplete={autoComplete}
        min={min}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 ${
          error ? "border-destructive" : ""
        }`}
      />
      <FieldError id={`${name}-error`} error={error} />
    </div>
  );
}

function Textarea({
  label,
  name,
  required,
  placeholder,
  rows,
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  rows: number;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor={name}>
        {label} {required && <span className="text-secondary">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 ${
          error ? "border-destructive" : ""
        }`}
      />
      <FieldError id={`${name}-error`} error={error} />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  required,
  error,
}: {
  label: string;
  name: string;
  options: readonly string[];
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor={name}>
        {label} {required && <span className="text-secondary">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 ${
          error ? "border-destructive" : ""
        }`}
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError id={`${name}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-destructive">
      {error}
    </p>
  );
}
