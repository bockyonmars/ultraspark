# UltraSpark Admin Dashboard

Next.js admin dashboard for the UltraSpark Cleaning backend API. This app is focused on the current backend scope only:

- contacts
- quotes
- invoices
- bookings
- support tickets
- customers
- services
- analytics
- audit logs

It does not add a separate backend. All data is fetched from the existing NestJS API at `NEXT_PUBLIC_API_URL`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- lucide-react
- Fetch API

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variable:

- `NEXT_PUBLIC_API_URL=https://api.ultrasparkcleaning.co.uk/api/v1`

## Install

```bash
cd admin
npm install
```

## Run Locally

```bash
cd admin
npm run dev
```

The app will run at `http://localhost:3000`.

## Build

```bash
cd admin
npm run build
```

## Features

- `/login` using `POST /auth/login`
- route protection with admin session cookie plus `/auth/me` validation
- dashboard overview with KPI cards, charts, recent submissions, latest quotes, latest bookings
- traffic and funnel page using backend events until web analytics is added
- contacts, quotes, and bookings management with status updates
- invoice management with create, edit, PDF upload, protected PDF open, send email, resend, and mark paid actions
- quote-to-invoice action from quote detail pages
- email history and customer activity timeline on invoice detail
- customer table plus customer history drawer
- support ticket drawer with related invoice visibility
- services overview with request counts
- analytics visualizations
- audit log feed
- settings page for environment and logged-in admin info

## Deploy To Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repo as a new project.
3. Set the project root directory to `admin`.
4. Add the environment variable:

```bash
NEXT_PUBLIC_API_URL=https://api.ultrasparkcleaning.co.uk/api/v1
```

5. Deploy.

## Invoice Operations

Invoices live at `/invoices`. Admins can:

- create invoice records manually or from an existing quote
- link invoices to customers, bookings, quotes, and support tickets
- upload or replace an externally generated PDF invoice
- send a professional invoice email with the PDF attached and payment link included
- view email status, attachments, and activity history
- mark invoices as paid

The admin app never stores email or storage credentials. It calls protected backend endpoints with the admin JWT cookie, and the backend handles email delivery, attachment storage, and audit/activity logging.

## Quote Request Workflow

The Quotes section has two views:

- **Created Quotes** shows formal quote and estimate documents with status, totals, dates, and actions.
- **Website Requests** shows quote form submissions from the website.

Open a website request to review the full customer/service details before
creating the quote. Choosing **Create Quote** opens the normal quote builder with
customer details, service address, requested service, request notes, and a
default editable line item already filled in. Pricing is intentionally left at
zero when there are no pricing rules, so staff must confirm the rate and
quantity before sending.

The quote builder supports service-specific document types, including House
Cleaning Quote, Office Cleaning Quote, Deep Cleaning Quote, End of Tenancy
Cleaning Quote, After Builders Cleaning Quote, Commercial Cleaning Quote,
Carpet Cleaning Quote, Move-In / Move-Out Cleaning Quote, and General Cleaning
Quote. Website request conversion picks the closest type from the selected
service, so an Office Cleaning request opens as an Office Cleaning Quote with
office-specific included/excluded scope text. The same label is used in preview,
detail, print/PDF output, and the quote email.

After saving, the formal quote is linked back to the original request and the
request status becomes `QUOTED`. If a request already has a linked quote, the UI
shows **Quote created** and offers **View Quote** instead of making another
quote the primary action.

When **Send quote** is clicked, the admin calls
`POST /api/v1/admin/quotes/:id/send`. Staging can use backend
`EMAIL_PROVIDER=log`, which records the quote email as sent in `EmailLog`
without contacting a real provider. Production delivery should use a supported
provider such as Resend with `EMAIL_API_KEY` or `RESEND_API_KEY` configured.

## Connect The Admin Subdomain

1. In Vercel project settings, add the domain `admin.ultrasparkcleaning.co.uk`.
2. In your DNS provider, create the CNAME or A record that Vercel provides.
3. Wait for SSL to provision.
4. Confirm the backend CORS configuration still allows requests from the admin origin if needed.

## Notes

- The JWT is stored in a secure same-site cookie on the client so middleware can protect routes.
- If the backend returns missing fields, the UI falls back to zeros, `N/A`, or empty states.
- When exact web traffic data is unavailable, the traffic page uses backend submission events as funnel signals.
