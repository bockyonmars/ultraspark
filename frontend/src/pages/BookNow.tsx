import { ChangeEvent, useState } from "react";
import { SubmitButton } from "../components/Buttons";
import {
  FormMessage,
  SelectField,
  TextAreaField,
  TextField,
} from "../components/FormFields";
import { SiteLayout } from "../components/Layout";
import { useSubmitForm } from "../lib/useSubmitForm";

const serviceOptions = [
  "Home Cleaning",
  "Office Cleaning",
  "Deep Cleaning",
  "End of Tenancy Cleaning",
  "AirBnB Cleaning",
];

const timeOptions = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

const initialBooking = {
  "Full Name": "",
  "Email Address": "",
  "Phone Number": "",
  "Service Type": serviceOptions[0],
  Date: "",
  Time: "",
  Address: "",
  "Additional Notes": "",
};

export default function BookNow() {
  const [form, setForm] = useState(initialBooking);
  const submission = useSubmitForm("/bookings");

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <SiteLayout>
      <section className="form-page">
        <div className="form-heading">
          <h1>Book Your Cleaning Service</h1>
          <p>Fill in your details below and we'll confirm your booking.</p>
        </div>
        <form
          className="stacked-form"
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
            required
            type="tel"
            value={form["Phone Number"]}
          />
          <SelectField
            label="Service Type"
            name="Service Type"
            onChange={updateField}
            options={serviceOptions}
            required
            value={form["Service Type"]}
          />
          <TextField
            label="Date"
            name="Date"
            onChange={updateField}
            required
            type="date"
            value={form.Date}
          />
          <label className="field">
            <span>Time</span>
            <select
              name="Time"
              onChange={updateField}
              required
              value={form.Time}
            >
              <option value="">Select a time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
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
            label="Book Your Cleaning"
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
