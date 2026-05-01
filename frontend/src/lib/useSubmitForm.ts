import { FormEvent, useState } from "react";
import {
  PublicEndpoint,
  PublicPayload,
  submitPublicForm,
} from "./api";

type SubmissionState = "idle" | "loading" | "success" | "error";

export function useSubmitForm(endpoint: PublicEndpoint) {
  const [state, setState] = useState<SubmissionState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    payload: PublicPayload,
  ) {
    event.preventDefault();
    setState("loading");
    setError("");

    try {
      await submitPublicForm(endpoint, payload);
      setState("success");
      window.setTimeout(() => {
        window.location.assign("/thank-you");
      }, 450);
    } catch (caughtError) {
      setState("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again shortly.",
      );
    }
  }

  return {
    state,
    error,
    isSubmitting: state === "loading",
    isSuccess: state === "success",
    handleSubmit,
  };
}
