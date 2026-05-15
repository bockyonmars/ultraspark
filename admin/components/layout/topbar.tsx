"use client";

import Link from "next/link";
import { LogOut, Menu, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { navItems } from "./app-sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/traffic": "Traffic",
  "/contacts": "Contacts",
  "/quotes": "Quotes",
  "/invoices": "Invoices",
  "/bookings": "Bookings",
  "/support": "Support",
  "/emails/compose": "Compose Email",
  "/customers": "Customers",
  "/services": "Services",
  "/analytics": "Analytics",
  "/audit-logs": "Audit Logs",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { admin, logout } = useAuth();

  const pageTitle = useMemo(() => {
    const exact = pageTitles[pathname];
    if (exact) return exact;

    const match = Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(`${path}/`));

    return match?.[1] ?? "UltraSpark Admin";
  }, [pathname]);
  const adminName = admin
    ? `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() || admin.email
    : "there";

  function submitSearch() {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleLogout() {
    setIsMenuOpen(false);
    logout();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:static lg:px-8 lg:py-4">
        <div className="flex items-start justify-between gap-3 lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open navigation menu"
                className="shrink-0 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {pageTitle}
                </h2>
                <p className="truncate text-sm text-slate-500">
                  Welcome back, {adminName}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <div className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitSearch();
                }}
                placeholder="Search this page"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={submitSearch}>
              Search
            </Button>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 lg:hidden">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitSearch();
              }}
              placeholder="Search this page"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={submitSearch}>
            Search
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-50 transition lg:hidden",
          isMenuOpen
            ? "pointer-events-auto bg-slate-950/40"
            : "pointer-events-none bg-transparent",
        )}
        onClick={() => setIsMenuOpen(false)}
      >
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[min(21rem,88vw)] flex-col overflow-y-auto border-r bg-white p-4 shadow-2xl transition-transform",
            isMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 p-4 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">
                UltraSpark
              </p>
              <h1 className="mt-1 text-lg font-semibold">Cleaning Admin</h1>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close navigation menu"
              className="text-white hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-secondary text-primary"
                      : "text-slate-600 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="mt-4 w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </aside>
      </div>
    </>
  );
}
