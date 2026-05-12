const FALLBACK_API_URL = "https://api.ultrasparkcleaning.co.uk/api/v1";

export const API_BASE_URL = (import.meta.env.VITE_API_URL || FALLBACK_API_URL).replace(/\/+$/, "");

export type PublicEndpoint = "/contact" | "/quotes" | "/bookings";

type JsonRecord = Record<string, unknown>;

export class PublicFormError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PublicFormError";
    this.status = status;
  }
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as JsonRecord;
  const message = record.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter(Boolean).join(" ");
  const error = record.error;
  return typeof error === "string" ? error : undefined;
}

export async function submitPublicForm<TResponse = unknown>(
  endpoint: PublicEndpoint,
  payload: JsonRecord,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);

  if (!response.ok) {
    throw new PublicFormError(
      getErrorMessage(body) ||
        "We could not send your request just now. Please try again or contact us on WhatsApp.",
      response.status,
    );
  }

  return body as TResponse;
}
