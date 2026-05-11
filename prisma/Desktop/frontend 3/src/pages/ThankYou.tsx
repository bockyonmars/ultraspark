import { Check } from "lucide-react";
import { ButtonLink } from "../components/Buttons";
import { ThankYouBrand } from "../components/Layout";

export default function ThankYou() {
  return (
    <main className="thank-you-page">
      <ThankYouBrand />
      <section className="thank-you-card">
        <div className="thank-you-icon" aria-hidden="true">
          <Check size={44} />
        </div>
        <h1>Booking Request Confirmed</h1>
        <p>We've received your request and will contact you shortly</p>
      </section>
      <ButtonLink href="/" className="thank-you-button">
        Back to Home
      </ButtonLink>
    </main>
  );
}
