import { createFileRoute, Link } from "@tanstack/react-router";
import { metaFor } from "@/lib/seo";
import { Clock, Eye, Heart, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import { SERVICE_AREA } from "@/lib/constants";

export const Route = createFileRoute("/about")({
  head: () =>
    metaFor(
      "About",
      `Learn about UltraSpark Cleaning Services, a detail-focused cleaning team serving homes and businesses in ${SERVICE_AREA}.`,
    ),
  component: AboutPage,
});

const values = [
  { icon: Eye, title: "Detail-driven", desc: "We notice the things others miss." },
  { icon: Heart, title: "Customer-first", desc: "Your satisfaction shapes every visit." },
  { icon: ShieldCheck, title: "Trustworthy", desc: "Vetted cleaners you can welcome in." },
  { icon: Clock, title: "Flexible", desc: "Bookings that fit your routine." },
  { icon: Users, title: "Friendly team", desc: "Real people who care about your space." },
  { icon: MessagesSquare, title: "Easy to reach", desc: "WhatsApp or email — we reply fast." },
];

function AboutPage() {
  return (
    <>
      <section className="bg-gradient-soft py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
            About Us
          </div>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl text-balance">
            Reliable cleaning services focused on quality, care, and detail
          </h1>
          <p className="mt-6 text-muted-foreground leading-relaxed md:text-lg">
            UltraSpark Cleaning Services supports homes, offices, landlords, tenants, short-let
            hosts, and businesses in {SERVICE_AREA}. Our team focuses on detail, consistency,
            and customer satisfaction, helping every space feel fresh, hygienic, and welcoming.
          </p>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold text-primary md:text-4xl">
            What we stand for
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-secondary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link
              to="/booking"
              search={{ request: "booking" }}
              className="inline-flex rounded-full bg-gradient-accent px-8 py-4 text-sm font-semibold text-white shadow-elegant transition-transform hover:scale-105"
            >
              Book your first clean
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
