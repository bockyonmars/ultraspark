type GtagCommand = "js" | "config" | "event";
type Gtag = (command: GtagCommand, target: string | Date, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

type LeadKind = "contact" | "quote" | "booking";

const googleAdsId = import.meta.env.VITE_GOOGLE_ADS_ID;
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

const conversionLabels: Partial<Record<LeadKind, string>> = {
  contact: import.meta.env.VITE_ADS_CONTACT_CONVERSION_LABEL,
  quote: import.meta.env.VITE_ADS_QUOTE_CONVERSION_LABEL,
  booking: import.meta.env.VITE_ADS_BOOKING_CONVERSION_LABEL,
};

let initialized = false;
let initializing = false;
let lastTrackedPagePath: string | undefined;

function hasAnalyticsIds() {
  return Boolean(googleAdsId || gaMeasurementId);
}

function warnAnalyticsError(action: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.warn(`[analytics] ${action} failed`, error);
  }
}

function getExistingGtagScript(id: string) {
  if (typeof document === "undefined") return null;
  const encodedId = encodeURIComponent(id);
  return document.querySelector(
    `script[data-ultraspark-gtag="${id}"], script[src*="googletagmanager.com/gtag/js?id=${encodedId}"]`,
  );
}

function ensureGtagScript(id: string) {
  if (typeof document === "undefined" || getExistingGtagScript(id)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.ultrasparkGtag = id;
  document.head.appendChild(script);
}

function safeGtag(command: GtagCommand, target: string | Date, params?: Record<string, unknown>) {
  try {
    window.gtag?.(command, target, params);
  } catch (error) {
    warnAnalyticsError(`${command}:${String(target)}`, error);
  }
}

export function initAnalytics() {
  if (typeof window === "undefined" || initialized || initializing || !hasAnalyticsIds()) return;

  const primaryId = googleAdsId || gaMeasurementId;
  if (!primaryId) return;

  initializing = true;

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag(...args) {
        window.dataLayer?.push(args);
      };

    ensureGtagScript(primaryId);
    safeGtag("js", new Date());

    if (googleAdsId) {
      safeGtag("config", googleAdsId, { send_page_view: false });
    }

    if (gaMeasurementId) {
      safeGtag("config", gaMeasurementId, { send_page_view: false });
    }

    initialized = true;
  } catch (error) {
    warnAnalyticsError("init", error);
  } finally {
    initializing = false;
  }
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !hasAnalyticsIds()) return;
  if (path === lastTrackedPagePath) return;

  initAnalytics();
  if (!window.gtag) return;

  const params = {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  };

  try {
    if (googleAdsId) safeGtag("config", googleAdsId, params);
    if (gaMeasurementId) safeGtag("config", gaMeasurementId, params);
    lastTrackedPagePath = path;
  } catch (error) {
    warnAnalyticsError("page_view", error);
  }
}

function trackLeadSubmission(kind: LeadKind, requestId?: string) {
  if (typeof window === "undefined" || !hasAnalyticsIds()) return;

  initAnalytics();
  if (!window.gtag) return;

  const eventName =
    kind === "contact"
      ? "contact_form_submitted"
      : kind === "quote"
        ? "quote_request_submitted"
        : "booking_request_submitted";

  try {
    safeGtag("event", eventName, {
      form_type: kind,
      ...(requestId ? { request_id: requestId } : {}),
    });

    const conversionLabel = conversionLabels[kind];
    if (googleAdsId && conversionLabel) {
      safeGtag("event", "conversion", {
        send_to: `${googleAdsId}/${conversionLabel}`,
        ...(requestId ? { transaction_id: requestId } : {}),
      });
    }
  } catch (error) {
    warnAnalyticsError(`${kind}_submission`, error);
  }
}

export function trackContactSubmitted(requestId?: string) {
  trackLeadSubmission("contact", requestId);
}

export function trackQuoteSubmitted(requestId?: string) {
  trackLeadSubmission("quote", requestId);
}

export function trackBookingSubmitted(requestId?: string) {
  trackLeadSubmission("booking", requestId);
}
