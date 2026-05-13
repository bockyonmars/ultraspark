import { Link } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import logo from "@/assets/logo.png";
import { CONTACT, SERVICE_AREA_SHORT } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1.1fr]">
          <div>
            <div className="inline-block rounded-2xl bg-white/95 p-3">
              <img
                src={logo}
                alt="UltraSpark Cleaning Services"
                className="h-14 w-auto"
                width={512}
                height={512}
                loading="lazy"
              />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
              Reliable home, office, and short-let cleaning across {SERVICE_AREA_SHORT}.
              Detail-focused, friendly, and built around your schedule.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-glow">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-primary-glow">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-primary-foreground/80 hover:text-primary-glow">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-primary-foreground/80 hover:text-primary-glow">
                  Book
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/80 hover:text-primary-glow">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary-foreground/80 hover:text-primary-glow">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-glow">
              Get in touch
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-start gap-2 text-primary-foreground/80 hover:text-primary-glow"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat with UltraSpark on WhatsApp"
                  className="flex items-start gap-2 text-primary-foreground/80 hover:text-primary-glow"
                >
                  <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/80">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {SERVICE_AREA_SHORT}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-primary-foreground/60">
          © 2026 UltraSpark Cleaning Services. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
