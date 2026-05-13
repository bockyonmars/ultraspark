import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import logo from "@/assets/logo.png";
import { CONTACT } from "@/lib/constants";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/booking", label: "Book" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/90 shadow-soft backdrop-blur-lg" : "bg-background"
      }`}
    >

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link to="/" className="flex min-w-0 items-center" onClick={() => setOpen(false)}>
          <img
            src={logo}
            alt="UltraSpark Cleaning Services"
            className="h-14 w-auto max-w-[180px] object-contain sm:h-16 sm:max-w-[220px] lg:h-[72px]"
            width={512}
            height={512}
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-primary"
              activeProps={{
                className: "rounded-full px-4 py-2 text-sm font-semibold text-primary bg-accent",
              }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with UltraSpark on WhatsApp"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-secondary"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
          <Link
            to="/booking"
            search={{ request: "booking" }}
            className="rounded-full bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-105"
          >
            Book a Cleaning
          </Link>
        </div>

        <button
          className="rounded-full p-2 text-primary lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background px-4 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 font-medium text-foreground/80 hover:bg-accent hover:text-primary"
                activeProps={{
                  className: "rounded-lg px-4 py-3 font-semibold text-primary bg-accent",
                }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with UltraSpark on WhatsApp"
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary"
            >
              <WhatsAppIcon className="h-5 w-5" /> {CONTACT.phoneDisplay}
            </a>
            <Link
              to="/booking"
              search={{ request: "booking" }}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gradient-accent px-5 py-3 text-center font-semibold text-white"
            >
              Book a Cleaning
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
