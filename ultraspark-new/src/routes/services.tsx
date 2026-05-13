import { createFileRoute, Link } from "@tanstack/react-router";
import { ServiceCards } from "@/components/ServiceCards";
import { SERVICE_AREA } from "@/lib/constants";
import { metaFor } from "@/lib/seo";

export const Route = createFileRoute("/services")({
  head: () =>
    metaFor(
      "Services",
      `Home cleaning, office cleaning, deep cleaning, short-let cleaning, and end-of-tenancy cleaning in ${SERVICE_AREA}.`,
    ),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <section className="bg-gradient-soft py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
            Our Services
          </div>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl text-balance">
            Cleaning services for homes and businesses
          </h1>
          <p className="mt-5 text-muted-foreground md:text-lg">
            From regular home cleans and short-let turnovers to end-of-tenancy and deep cleaning,
            pick the service that fits your space.
          </p>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <ServiceCards />
          <div className="mt-14 text-center">
            <Link
              to="/booking"
              search={{ request: "quote" }}
              className="inline-flex rounded-full bg-gradient-accent px-8 py-4 text-sm font-semibold text-white shadow-elegant transition-transform hover:scale-105"
            >
              Request a Free Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
