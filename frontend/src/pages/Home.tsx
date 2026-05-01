import {
  Bed,
  Building2,
  Check,
  Home as HomeIcon,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { ButtonLink } from "../components/Buttons";
import { SiteLayout } from "../components/Layout";

const services = [
  {
    title: "Home Cleaning",
    text: "Regular cleaning to keep your home fresh, spotless, and comfortable.",
    icon: HomeIcon,
  },
  {
    title: "Office Cleaning",
    text: "Professional cleaning to maintain a clean and productive workspace.",
    icon: Building2,
  },
  {
    title: "Deep Cleaning",
    text: "Thorough, detailed cleaning for hard-to-reach areas and deep sanitation.",
    icon: Sparkles,
  },
  {
    title: "Airbnb Cleaning",
    text: "Fast, reliable cleaning between guest stays to keep your property guest-ready.",
    icon: Bed,
  },
  {
    title: "End of Tenancy Cleaning",
    text: "Comprehensive cleaning to ensure your property is spotless for the next tenant.",
    icon: KeyRound,
  },
];

const reasons = [
  {
    title: "Trusted Professionals",
    text: "Our trained cleaners are reliable, detail-oriented, and committed to delivering consistent results.",
  },
  {
    title: "Flexible Scheduling",
    text: "Book services at your convenience with flexible time slots that fit your routine.",
  },
  {
    title: "Satisfaction Guaranteed",
    text: "We prioritize your satisfaction and ensure every job is completed to the highest standard.",
  },
];

export default function Home() {
  return (
    <SiteLayout showCta>
      <section className="hero">
        <div className="section-inner hero-grid">
          <div className="hero-copy">
            <h1>Professional Cleaning Services You Can Trust</h1>
            <p>
              Reliable home and office cleaning services with flexible
              scheduling and spotless results.
            </p>
            <div className="hero-actions">
              <ButtonLink href="/book-now">Book now</ButtonLink>
              <ButtonLink href="/get-quote" variant="secondary">
                Get a quote
              </ButtonLink>
            </div>
            <ul className="hero-checks" aria-label="Service highlights">
              {["Trusted cleaners", "Flexible scheduling", "5 - star service"].map(
                (item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <img
            className="hero-image"
            src="/images/cleaning-hero.png"
            alt="UltraSpark cleaner in a bright kitchen"
          />
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="section-heading">
          <h2>Our cleaning services</h2>
          <p>Professional cleaning solutions tailored to your needs.</p>
        </div>
        <div className="services-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article className="service-card" key={service.title}>
                <span className="service-icon" aria-hidden="true">
                  <Icon size={25} fill="currentColor" strokeWidth={1.4} />
                </span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <a href="/get-quote" className="learn-more">
                  Learn more <span aria-hidden="true">-&gt;</span>
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="why-section">
        <div className="section-heading">
          <h2>Why Choose Us</h2>
          <p>
            We deliver reliable, high-quality cleaning services you can count
            on every time.
          </p>
        </div>
        <div className="why-grid">
          {reasons.map((reason) => (
            <article className="why-card" key={reason.title}>
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="section-inner about-grid">
          <div>
            <h2>About UltraSpark</h2>
            <p>
              We are a dedicated cleaning service committed to delivering, high
              quality results for homes and businesses. Our team focuses on
              professionalism. attention to detail and ensuring every space we
              clean feels fresh and welcoming.
            </p>
          </div>
          <img
            src="/images/about-cleaning.png"
            alt="UltraSpark cleaners in a tidy living room"
          />
        </div>
      </section>
    </SiteLayout>
  );
}
