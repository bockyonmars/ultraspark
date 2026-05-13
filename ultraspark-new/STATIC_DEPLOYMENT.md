# UltraSpark New Static Deployment

`ultraspark-new` is configured to deploy as a client-side static SPA on Render.

## Why the white screen happened

The project previously used TanStack Start/Cloudflare SSR output (`dist/client` and `dist/server`). Render Static Sites only serve static files and do not run the server/SSR bundle. If the static host only publishes the client files without a proper client-side SPA entry/fallback, the app can render a blank page.

## Render Static Site settings

Use these settings for the public frontend service:

- Root Directory: `ultraspark-new`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist/client`

Add this rewrite in Render Static Site settings:

```text
/*  /index.html  200
```

The rewrite is required so direct visits or refreshes on routes such as `/services`, `/booking`, `/contact`, `/privacy`, and `/thank-you` serve `index.html` and allow TanStack Router to handle routing client-side.

## Required environment variables

```env
VITE_API_URL=https://api.ultrasparkcleaning.co.uk/api/v1
VITE_GOOGLE_ADS_ID=AW-18124947759
VITE_GA_MEASUREMENT_ID=G-K2KM4RM8WN
VITE_ADS_CONTACT_CONVERSION_LABEL=
VITE_ADS_QUOTE_CONVERSION_LABEL=
VITE_ADS_BOOKING_CONVERSION_LABEL=
```

## Local static verification

```bash
npm install
npm run build
npx serve dist/client
```

Then test:

- `/`
- `/services`
- `/booking`
- `/contact`
- `/privacy`
- `/thank-you`

Contact, quote, and booking forms should continue calling the backend via `VITE_API_URL`.
