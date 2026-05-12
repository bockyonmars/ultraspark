import { Link } from "@tanstack/react-router";
import { ArrowRight, BedDouble, Building2, Home, KeyRound, Sparkles, Truck } from "lucide-react";

import { SERVICES } from "@/lib/constants";

const iconsBySlug = {
  home: Home,
  office: Building2,
  deep: Sparkles,
  airbnb: BedDouble,
  tenancy: KeyRound,
  move: Truck,
} as const;

export function ServiceCards({ compact = false }: { compact?: boolean }) {
  const list = compact ? SERVICES.slice(0, 6) : SERVICES;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(({ slug, title, desc }) => {
        const Icon = iconsBySlug[slug];
        return (
          <div
            key={title}
            className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant md:p-7"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-accent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30" />
            <div className="relative flex flex-1 flex-col">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-accent text-white shadow-soft">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-primary">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <Link
                to="/booking"
                search={{ request: "quote" }}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition-all hover:gap-2.5"
              >
                Request Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
