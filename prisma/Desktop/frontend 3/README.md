# UltraSpark Customer Frontend

React/Vite customer-facing frontend for the public UltraSpark Cleaning site.

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on the URL Vite prints, usually `http://localhost:5173`.

## API Configuration

The app posts public forms to:

```text
https://api.ultrasparkcleaning.co.uk/api/v1
```

Override it locally with:

```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1 npm run dev
```

## Build

```bash
npm run build
```

The deployable static output is `dist/`.

## Deploy

Deploy the `frontend/` directory as a static app:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://api.ultrasparkcleaning.co.uk/api/v1`

The included Netlify `_redirects` and Vercel `vercel.json` route direct visits like
`/book-now` and `/thank-you` back to the SPA entry point.
