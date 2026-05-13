import { createFileRoute } from "@tanstack/react-router";
import { BookingForm, type RequestKind } from "@/components/BookingForm";
import { metaFor } from "@/lib/seo";
import { SERVICE_AREA_SHORT } from "@/lib/constants";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/booking")({
  validateSearch: (search: Record<string, unknown>): { request: RequestKind } => ({
    request: search.request === "booking" ? "booking" : "quote",
  }),
  head: () =>
    metaFor(
      "Book",
      `Book your cleaning service or request a free quote from UltraSpark Cleaning Services in ${SERVICE_AREA_SHORT}.`,
    ),
  component: BookingPage,
});

const perks = [
  "Free, no-obligation quote",
  "Flexible day or evening slots",
  `Same-week availability in ${SERVICE_AREA_SHORT}`,
  "Friendly response, usually within hours",
];

function BookingPage() {
  const { request } = Route.useSearch();
  const isBooking = request === "booking";

  return (
    <section className="bg-gradient-soft py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
            Book / Quote
          </div>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl text-balance">
            {isBooking ? "Request your cleaning booking" : "Request your cleaning quote"}
          </h1>
          <p className="mt-5 text-muted-foreground">
            Fill in a few details and our team will get back to you with availability, next steps,
            and a tailored price.
          </p>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                <span className="text-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <BookingForm initialKind={request} />
      </div>
    </section>
  );
}
