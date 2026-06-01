import { Mail, Phone } from "lucide-react";
import { ReactNode } from "react";
import { ButtonLink } from "./Buttons";
import { companyContact } from "../lib/companyContact";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Contact Us", href: "/contact-us" },
];

export function SiteLayout({
  children,
  showCta = false,
}: {
  children: ReactNode;
  showCta?: boolean;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      {showCta ? <CallToAction /> : null}
      <Footer />
    </>
  );
}

export function Header() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  return (
    <header>
      <div className="topbar">
        <a href={`mailto:${companyContact.email}`} className="topbar-link">
          <span className="topbar-icon" aria-hidden="true">
            <Mail size={16} />
          </span>
          {companyContact.email}
        </a>
        <a
          href={companyContact.phoneHref}
          className="topbar-link"
          aria-label="Call UltraSpark Cleaning"
        >
          <span className="topbar-icon" aria-hidden="true">
            <Phone size={16} />
          </span>
          {companyContact.phoneDisplay}
        </a>
        <ButtonLink href="/get-quote" variant="secondary" className="topbar-cta">
          Get a quote
        </ButtonLink>
      </div>

      <nav className="navbar" aria-label="Primary navigation">
        <a className="nav-logo" href="/" aria-label="UltraSpark home">
          <img src="/images/ultraspark-logo.png" alt="UltraSpark Cleaning" />
        </a>
        <div className="nav-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <a
                key={item.label}
                href={item.href}
                className={isActive ? "active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </div>
        <ButtonLink href="/book-now" className="nav-book">
          Book now
        </ButtonLink>
      </nav>
    </header>
  );
}

function CallToAction() {
  return (
    <section className="final-cta">
      <div className="section-inner final-cta-inner">
        <h2>Ready for a cleaner, healthier space?</h2>
        <p>
          Book your cleaning service today and enjoy a spotless home or office
          without the stress
        </p>
        <div className="cta-actions">
          <ButtonLink href="/book-now">Book now</ButtonLink>
          <ButtonLink href="/get-quote" variant="light">
            Get a Quote
          </ButtonLink>
        </div>
        <small>
          No contracts <span aria-hidden="true">&bull;</span> Flexible
          scheduling <span aria-hidden="true">&bull;</span> Satisfaction
          guaranteed
        </small>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-inner footer-grid">
        <div className="footer-brand">
          <img src="/images/ultraspark-logo.png" alt="UltraSpark Cleaning" />
          <p>Reliable cleaning services for homes and businesses.</p>
        </div>
        <div>
          <h3>Company</h3>
          <a href="/">Home</a>
          <a href="/services">Services</a>
          <a href="/#about">About Us</a>
          <a href="/contact-us">Contact Us</a>
        </div>
        <div>
          <h3>Contact</h3>
          <a href={`mailto:${companyContact.email}`}>
            Email: {companyContact.email}
          </a>
          <a href={companyContact.phoneHref}>
            Phone: {companyContact.phoneDisplay}
          </a>
          <p>Location: London, UK</p>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 UltraSpark. All rights reserved.</div>
    </footer>
  );
}

export function ThankYouBrand() {
  return (
    <a className="thank-you-brand" href="/" aria-label="UltraSpark home">
      <img src="/images/ultraspark-logo.png" alt="UltraSpark" className="thank-you-logo" />
      <span>
        <strong>UltraSpark</strong>
        <span>Cleaning Services</span>
      </span>
    </a>
  );
}
