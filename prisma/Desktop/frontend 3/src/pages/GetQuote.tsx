import { ChangeEvent, useState } from "react";
import { SubmitButton } from "../components/Buttons";
import {
  FormMessage,
  TextAreaField,
  TextField,
} from "../components/FormFields";
import { SiteLayout } from "../components/Layout";
import { useSubmitForm } from "../lib/useSubmitForm";

const initialQuote = {
  "Full Name": "",
  "Email Address": "",
  "Phone Number": "",
  Address: "",
  "Additional Notes": "",
};

export default function GetQuote() {
  const [form, setForm] = useState(initialQuote);
  const submission = useSubmitForm("/quotes");

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
      <section className="form-page quote-page">
        <div className="form-heading">
          <h1>Get a Free Quote</h1>
          <p>Tell us about your space below and we'll provide a tailored quote.</p>
        </div>
        <form
          className="stacked-form quote-form"
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
            label="Email Address"
            name="Email Address"
            onChange={updateField}
            placeholder="Enter Email Address"
            required
            type="email"
            value={form["Email Address"]}
          />
          <TextField
            label="Phone Number"
            name="Phone Number"
            onChange={updateField}
            placeholder="Enter Phone Number"
            type="tel"
            value={form["Phone Number"]}
          />
          <TextField
            label="Address"
            name="Address"
            onChange={updateField}
            required
            value={form.Address}
          />
          <TextAreaField
            label="Additional Notes"
            name="Additional Notes"
            onChange={updateField}
            value={form["Additional Notes"]}
          />
          <SubmitButton
            isSubmitting={submission.isSubmitting}
            isSuccess={submission.isSuccess}
            label="Request Quote"
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
