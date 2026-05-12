import { createFileRoute } from "@tanstack/react-router";
import { metaFor } from "@/lib/seo";
import { CONTACT, SERVICE_AREA_SHORT } from "@/lib/constants";

export const Route = createFileRoute("/privacy")({
  head: () =>
    metaFor(
      "Privacy Policy",
      "Privacy policy for UltraSpark Cleaning Services — how we collect, use and protect your information.",
    ),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Legal</div>
        <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 2026</p>

        <div className="prose prose-slate mt-10 max-w-none space-y-8 text-foreground">
          <Block title="Introduction">
            UltraSpark Cleaning Services ("we", "us", "our") is committed to protecting your
            privacy. This policy explains how we collect, use, and safeguard your personal
            information when you visit our website or request our cleaning services.
          </Block>

          <Block title="Information we collect">
            We may collect the following information when you contact us, request a quote, or book a
            cleaning service:
            <ul className="mt-3 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Your name and contact details (phone number, email address)</li>
              <li>Your service address, postcode and property details</li>
              <li>Booking details such as preferred date, time and service type</li>
              <li>Any additional notes you provide about your cleaning requirements</li>
            </ul>
          </Block>

          <Block title="How we use your information">
            We use your information to respond to enquiries, prepare quotes, schedule and deliver
            cleaning services, communicate with you about your bookings, and improve our service. We
            do not sell your information to third parties.
          </Block>

          <Block title="Data sharing">
            We only share your information with team members who need it to deliver your cleaning
            service, or with service providers (such as scheduling or email tools) acting on our
            behalf. We may also disclose information where required by law.
          </Block>

          <Block title="Data retention">
            We retain your personal information only as long as necessary to provide our services
            and to comply with our legal and accounting obligations.
          </Block>

          <Block title="Your rights">
            Under UK data protection law, you have the right to access, correct, or request deletion
            of the personal information we hold about you. To exercise these rights, please contact
            us at the address below.
          </Block>

          <Block title="Cookies">
            Our website may use a small number of cookies to ensure the site works correctly and to
            understand how visitors use it. You can control cookies through your browser settings.
          </Block>

          <Block title="Contact us">
            If you have any questions about this privacy policy or how we handle your information,
            please contact us at:
            <div className="mt-3 rounded-2xl border bg-card p-5 text-sm">
              <div>
                <span className="font-semibold text-primary">Email:</span>{" "}
                <a className="text-secondary hover:underline" href={`mailto:${CONTACT.email}`}>
                  {CONTACT.email}
                </a>
              </div>
              <div className="mt-1">
                <span className="font-semibold text-primary">WhatsApp:</span> {CONTACT.phoneDisplay}
              </div>
              <div className="mt-1">
                <span className="font-semibold text-primary">Service area:</span>{" "}
                {SERVICE_AREA_SHORT}
              </div>
            </div>
            <p className="mt-3 text-xs italic text-muted-foreground">
              Company registration and data controller details can be added here once confirmed.
            </p>
          </Block>
        </div>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-primary md:text-2xl">{title}</h2>
      <div className="mt-3 leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
