import { createFileRoute } from "@tanstack/react-router";
import { metaFor } from "@/lib/seo";
import { Clock, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/BookingForm";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CONTACT, SERVICE_AREA_SHORT } from "@/lib/constants";

export const Route = createFileRoute("/contact")({
  head: () =>
    metaFor(
      "Contact",
      `Contact UltraSpark Cleaning Services in ${SERVICE_AREA_SHORT} by WhatsApp or email. We respond Monday to Saturday.`,
    ),
  component: ContactPage,
});

const items = [
  { icon: WhatsAppIcon, label: "WhatsApp", value: CONTACT.phoneDisplay, href: CONTACT.whatsappUrl },
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: MapPin, label: "Service Area", value: SERVICE_AREA_SHORT },
];

function ContactPage() {
  return (
    <>
      <section className="bg-gradient-soft py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Contact</div>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl text-balance">
            Let's talk about your space
          </h1>
          <p className="mt-5 text-muted-foreground md:text-lg">
            Get in touch on WhatsApp, email, or send us your details below. We will get back to you
            fast.
          </p>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {items.map(({ icon: Icon, label, value, href }) => {
              const inner = (
                <div className="flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-all hover:shadow-elegant">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-accent text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </div>
                    <div className="mt-1 font-semibold text-primary">{value}</div>
                  </div>
                </div>
              );
              return href ? (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label === "WhatsApp" ? "Chat with UltraSpark on WhatsApp" : undefined}
                >
                  {inner}
                </a>
              ) : (
                <div key={label}>{inner}</div>
              );
            })}

            <div className="rounded-2xl border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-secondary">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-primary">Business Hours</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Monday – Saturday</span>
                  <span className="font-semibold text-foreground">8:00 AM – 6:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Sunday</span>
                  <span className="font-semibold text-foreground">By appointment</span>
                </li>
              </ul>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
