import { ChangeEvent, useState } from "react";
import { SubmitButton } from "../components/Buttons";
import {
  FormMessage,
  TextAreaField,
  TextField,
} from "../components/FormFields";
import { SiteLayout } from "../components/Layout";
import { useSubmitForm } from "../lib/useSubmitForm";

const initialContact = {
  "Full Name": "",
  Email: "",
  Message: "",
};

export default function ContactUs() {
  const [form, setForm] = useState(initialContact);
  const submission = useSubmitForm("/contact");

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <SiteLayout>
      <section className="contact-hero">
        <h1>Get in touch with our team</h1>
        <p>
          Have a question or need a custom cleaning service? We're here to
          help.
        </p>
      </section>

      <section className="section-inner contact-layout">
        <aside className="contact-details" aria-label="Contact information">
          <p>Have questions or need help?</p>
          <p>We're here to assist you.</p>
          <h2>Contact Information</h2>
          <h3>Email</h3>
          <a href="mailto:info@ultrasparkcleaning.co.uk">
            info@ultrasparkcleaning.co.uk
          </a>
          <h3>Phone</h3>
          <a href="https://wa.me/message/KHTHDSYA5FK6C1" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          <h3>Location</h3>
          <p>London, UK</p>
        </aside>

        <form
          className="contact-form"
          onSubmit={(event) => submission.handleSubmit(event, form)}
        >
          <TextField
            label="Full Name"
            name="Full Name"
            onChange={updateField}
            placeholder="Enter Full Name"
            required
            value={form["Full Name"]}
          />
          <TextField
            label="Email"
            name="Email"
            onChange={updateField}
            placeholder="Enter Email Address"
            required
            type="email"
            value={form.Email}
          />
          <TextAreaField
            label="Message"
            name="Message"
            onChange={updateField}
            required
            value={form.Message}
          />
          <SubmitButton
            isSubmitting={submission.isSubmitting}
            isSuccess={submission.isSuccess}
            label="Send Message"
          />
          <FormMessage
            error={submission.error}
            isSuccess={submission.isSuccess}
          />
        </form>
      </section>
    </SiteLayout>
  );
}
