import { useEffect } from "react";
import { ButtonLink } from "../components/Buttons";
import { SiteLayout } from "../components/Layout";
import { SectionHeader } from "../components/services/SectionHeader";
import { ServiceCard, ServiceItem } from "../components/services/ServiceCard";
import { ServicesGrid } from "../components/services/ServicesGrid";

const services: ServiceItem[] = [
  {
    id: "home-cleaning",
    title: "Home Cleaning",
    description: "Regular cleaning to keep your home fresh, spotless, and comfortable.",
    image: "/images/service-home.webp",
    imageAlt: "Cleaner vacuuming a living room",
    features: [
      "Dusting and service cleaning.",
      "Vacuuming and mopping.",
      "Kitchen and bathroom sanitization.",
    ],
  },
  {
    id: "office-cleaning",
    title: "Office Cleaning",
    description:
      "Professional cleaning services designed to maintain a clean, organized, and productive work environment for your team and clients.",
    image: "/images/service-office.webp",
    imageAlt: "Cleaner wiping an office desk",
    reverse: true,
    features: [
      "Desk and workspace cleaning.",
      "Trash removal and sanitization.",
      "High-touch surface disinfection.",
    ],
  },
  {
    id: "deep-cleaning",
    title: "Deep Cleaning",
    description:
      "A comprehensive, detail-focused cleaning service that targets hidden dirt, buildup, and hard-to-reach areas for a deeper, healthier space.",
    image: "/images/service-deep.webp",
    imageAlt: "Cleaner deep cleaning a bathroom shower screen",
    features: [
      "Detailed attention to neglected and hard-to-reach areas.",
      "Deep scrubbing of kitchen and bathroom.",
      "Removal of built-up dirt and grime.",
    ],
  },
  {
    id: "airbnb-cleaning",
    title: "Airbnb Cleaning",
    description:
      "Fast and reliable cleaning designed to prepare your property for the next guest, ensuring a spotless and welcoming experience every time.",
    image: "/images/service-airbnb.webp",
    imageAlt: "Cleaning team preparing a kitchen for guests",
    reverse: true,
    features: [
      "Quick turnaround to meet check-in deadlines.",
      "Turnover cleaning between guest stays.",
      "Bed making and linen arrangement.",
    ],
  },
  {
    id: "end-of-tenancy-cleaning",
    title: "End of Tenancy Cleaning",
    description:
      "A detailed, top-to-bottom cleaning service designed to restore the property to a spotless condition, ready for inspection or new occupants.",
    image: "/images/service-tenancy.webp",
    imageAlt: "Cleaner scrubbing an oven during end of tenancy cleaning",
    features: [
      "Cleaning aligned with landlord and agency standards.",
      "Kitchen appliances and cabinets thoroughly cleaned.",
      "Top-to-bottom property refresh before handover.",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Book your Service",
    description: "Choose your preferred service, date, and time in just a few clicks.",
  },
  {
    number: "02",
    title: "We handle the cleaning",
    description: "Our team arrives on time and delivers a reliable, high quality service.",
  },
  {
    number: "03",
    title: "Enjoy your space",
    description: "Relax in a clean, fresh environment without the stress.",
  },
];

function scrollToHashSection() {
  const hash = window.location.hash.replace("#", "");

  if (!hash) return;

  window.requestAnimationFrame(() => {
    const target = document.getElementById(hash);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

export default function ServicesPage() {
  useEffect(() => {
    scrollToHashSection();

    window.addEventListener("hashchange", scrollToHashSection);

    return () => {
      window.removeEventListener("hashchange", scrollToHashSection);
    };
  }, []);

  return (
    <SiteLayout>
      <section className="framer-services-hero" aria-labelledby="services-page-title">
        <div className="framer-services-hero-overlay" />
        <div className="framer-services-hero-content">
          <h1 id="services-page-title">
            Professional Cleaning
            <span>Services</span>
          </h1>
          <p>Reliable cleaning solutions for homes and businesses.</p>
          <ButtonLink href="/get-quote">Get a Quote</ButtonLink>
        </div>
      </section>

      <section className="framer-services-section" aria-label="UltraSpark cleaning services">
        <ServicesGrid>
          {services.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </ServicesGrid>
      </section>

      <section className="framer-how-section">
        <div className="section-inner">
          <SectionHeader eyebrow="How it works" title="Simple, reliable cleaning in just a few steps" />
          <div className="framer-how-grid">
            {steps.map((step) => (
              <article className="framer-how-card" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="framer-services-cta">
        <div className="section-inner framer-services-cta-inner">
          <h2>Ready to book your cleaning service?</h2>
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
    </SiteLayout>
  );
}
