const DEFAULT_API_BASE_URL = "https://api.ultrasparkcleaning.co.uk/api/v1";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredApiBase || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  "",
);

export type PublicEndpoint = "/bookings" | "/quotes" | "/contact";
export type PublicPayload = Record<string, string>;

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export async function submitPublicForm(
  endpoint: PublicEndpoint,
  payload: PublicPayload,
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let body: ApiResponse | undefined;

  try {
    body = (await response.json()) as ApiResponse;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    throw new Error(
      body?.message || "Something went wrong. Please try again shortly.",
    );
  }

  return body;
}
