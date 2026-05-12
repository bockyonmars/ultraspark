import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import logo from "@/assets/logo.png";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CONTACT } from "@/lib/constants";
import { metaFor } from "@/lib/seo";

type ThankYouType = "contact" | "quote" | "booking";

const copy: Record<ThankYouType, { title: string; body: string; next: string }> = {
  contact: {
    title: "Thanks for getting in touch",
    body: "Your message has been sent to the UltraSpark team.",
    next: "We will review your message and reply as soon as possible.",
  },
  quote: {
    title: "Your quote request is in",
    body: "Thanks for sharing your cleaning details with UltraSpark.",
    next: "We will review your request and contact you with availability, questions, or pricing.",
  },
  booking: {
    title: "Your booking request is in",
    body: "Thanks for requesting a cleaning slot with UltraSpark.",
    next: "We will check availability and contact you to confirm the booking details.",
  },
};

export const Route = createFileRoute("/thank-you")({
  validateSearch: (search: Record<string, unknown>): { type: ThankYouType } => ({
    type:
      search.type === "contact" || search.type === "booking" || search.type === "quote"
        ? search.type
        : "quote",
  }),
  head: () =>
    metaFor(
      "Thank You",
      "Thanks for contacting UltraSpark Cleaning Services. We have received your request.",
    ),
  component: ThankYouPage,
});

function ThankYouPage() {
  const { type } = Route.useSearch();
  const message = copy[type];

  return (
    <section className="bg-gradient-soft py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <div className="mx-auto inline-flex rounded-3xl bg-white p-4 shadow-soft">
          <img
            src={logo}
            alt="UltraSpark Cleaning Services"
            className="h-20 w-auto sm:h-24"
            width={512}
            height={512}
          />
        </div>

        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <h1 className="mt-6 text-4xl font-bold text-primary md:text-5xl text-balance">
          {message.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{message.body}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {message.next}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-7 py-3.5 text-sm font-bold text-white shadow-elegant transition-transform hover:scale-105"
          >
            Back to Homepage <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with UltraSpark on WhatsApp"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-7 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <WhatsAppIcon className="h-5 w-5" /> WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
}
