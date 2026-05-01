import { ChangeEvent, InputHTMLAttributes, SelectHTMLAttributes } from "react";

export type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
};

export function TextField({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  type = "text",
}: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
}: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: string[];
};

export function SelectField({
  label,
  name,
  options,
  value,
  onChange,
  required = false,
}: SelectFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        name={name}
        onChange={onChange}
        required={required}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormMessage({
  error,
  isSuccess,
}: {
  error: string;
  isSuccess: boolean;
}) {
  if (!error && !isSuccess) {
    return null;
  }

  return (
    <p className={error ? "form-message form-error" : "form-message form-success"} aria-live="polite">
      {error || "Submitted successfully. Redirecting..."}
    </p>
  );
}
