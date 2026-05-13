import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Clock,
  Eye,
  Heart,
  MessagesSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import heroImg from "@/assets/hero-cleaning.jpg";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ServiceCards } from "@/components/ServiceCards";
import { CONTACT, SERVICE_AREA, SERVICE_AREA_SHORT } from "@/lib/constants";
import { metaFor } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () =>
    metaFor(
      "UltraSpark Cleaning Services",
      `Reliable home, office, deep, short-let, and end-of-tenancy cleaning services in ${SERVICE_AREA}.`,
    ),
  component: Home,
});

const trustBadges = [
  { icon: ShieldCheck, label: "Trusted Cleaners" },
  { icon: Clock, label: "Flexible Scheduling" },
  { icon: Star, label: "5-Star Service" },
  { icon: Building2, label: "Homes & Businesses" },
];

const whyChoose = [
  {
    icon: Users,
    title: "Experienced Team",
    desc: "Skilled cleaners who know how to bring out the best in every home and workplace.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted Professionals",
    desc: "Carefully selected cleaners you can welcome into your space with confidence.",
  },
  {
    icon: Clock,
    title: "Flexible Booking",
    desc: "Daily, weekly, fortnightly or one-off, with scheduling that works around your routine.",
  },
  {
    icon: Eye,
    title: "Attention to Detail",
    desc: "From skirting boards to switches, we focus on the details that make spaces feel properly clean.",
  },
  {
    icon: MessagesSquare,
    title: "Reliable Communication",
    desc: "Clear updates, prompt replies, and easy booking via WhatsApp or email.",
  },
  {
    icon: Heart,
    title: "Satisfaction-Focused",
    desc: "Not happy? Let us know and we'll make it right. Your space, your standards.",
  },
];

const testimonials = [
  {
    quote:
      "UltraSpark did an amazing job with our end-of-tenancy clean. The property looked spotless.",
    name: "Sarah M.",
    role: "Tenant, Clapham",
  },
  {
    quote: "Reliable, friendly, and very professional. I now use them for regular home cleaning.",
    name: "James R.",
    role: "Homeowner, Islington",
  },
  {
    quote:
      "Great service for our Airbnb turnover cleaning. Fast communication and excellent results.",
    name: "Priya K.",
    role: "Airbnb Host, Shoreditch",
  },
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,oklch(0.72_0.13_195/0.25),transparent_50%),radial-gradient(circle_at_80%_70%,oklch(0.28_0.07_252/0.15),transparent_50%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-white/70 px-4 py-1.5 text-xs font-semibold text-secondary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Your trusted cleaning partner
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-primary text-balance md:text-5xl lg:text-6xl">
              Professional Cleaning Services You Can Trust
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Trusted cleaning support for homes, offices, landlords, tenants, and short-let
              properties across {SERVICE_AREA}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                search={{ request: "booking" }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-7 py-3.5 text-sm font-semibold text-white shadow-elegant transition-transform hover:scale-105"
              >
                Book a Cleaning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/booking"
                search={{ request: "quote" }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-white/70 px-7 py-3.5 text-sm font-semibold text-primary backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Get a Free Quote
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {trustBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border bg-white/70 px-3 py-2.5 backdrop-blur"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-secondary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-primary">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-accent opacity-20 blur-3xl" />
            <img
              src={heroImg}
              alt="Professional UltraSpark cleaner in a bright, freshly cleaned home"
              width={1536}
              height={1024}
              className="relative w-full rounded-[2rem] object-cover shadow-elegant"
            />
            <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-2xl border bg-white p-4 shadow-elegant md:flex animate-float">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-accent text-white">
                <Star className="h-6 w-6 fill-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-primary">5-Star Service</div>
                <div className="text-xs text-muted-foreground">
                  Trusted by busy homes and businesses
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              Our Services
            </div>
            <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
              Cleaning, tailored to your space
            </h2>
            <p className="mt-4 text-muted-foreground">
              From a one-off deep clean to weekly office support, we cover homes, workspaces, and
              short-let properties across {SERVICE_AREA}.
            </p>
          </div>
          <div className="mt-12">
            <ServiceCards />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section className="bg-gradient-soft py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              Why UltraSpark
            </div>
            <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
              Cleaning you can rely on
            </h2>
            <p className="mt-4 text-muted-foreground">
              We focus on the details that turn a clean space into a home or workplace people love
              being in.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {whyChoose.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-soft">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-secondary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-background py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              Testimonials
            </div>
            <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
              What our customers say
            </h2>
            <p className="mt-4 text-muted-foreground">
              Customers rely on UltraSpark for clear communication, careful work, and dependable
              results.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="relative rounded-2xl border bg-card p-7 shadow-soft">
                <Quote className="h-8 w-8 text-secondary/30" />
                <p className="mt-3 text-foreground leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex gap-0.5 text-secondary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <div className="mt-3 text-sm">
                  <div className="font-bold text-primary">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28 text-white">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_50%,white,transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-balance">
            Ready for a cleaner, healthier space?
          </h2>
          <p className="mt-5 text-lg text-white/85 max-w-2xl mx-auto">
            Book your cleaning service today and let UltraSpark handle the cleaning while you focus
            on what matters.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/booking"
              search={{ request: "booking" }}
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-elegant transition-transform hover:scale-105"
            >
              Book Now
            </Link>
            <Link
              to="/booking"
              search={{ request: "quote" }}
              className="rounded-full border-2 border-white/70 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Get a Free Quote
            </Link>
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with UltraSpark on WhatsApp"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-bold text-white shadow-elegant transition-transform hover:scale-105"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
