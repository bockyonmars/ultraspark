# UltraSpark Cleaning Backend

NestJS backend for the UltraSpark Cleaning website and admin operations portal. It supports public lead capture, admin authentication, customer/booking/quote management, invoice storage, invoice email sending, activity history, email notifications, analytics, audit logs, Swagger docs, and health checks.

## Stack

- NestJS with TypeScript
- PostgreSQL
- Prisma ORM
- JWT admin authentication
- Resend for transactional email
- Swagger at `/api/docs`

## Features

- Public endpoints:
  - `GET /api/v1/health`
  - `GET /api/v1/services`
  - `POST /api/v1/contact`
  - `POST /api/v1/quotes`
  - `POST /api/v1/bookings`
- Admin endpoints:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/customers`
  - `GET /api/v1/customers/:id`
  - `GET /api/v1/contact-messages`
  - `PATCH /api/v1/contact-messages/:id/status`
  - `GET /api/v1/quotes`
  - `GET /api/v1/quotes/:id`
  - `PATCH /api/v1/quotes/:id/status`
  - `GET /api/v1/admin/quotes`
  - `POST /api/v1/admin/quotes`
  - `GET /api/v1/admin/quotes/:id`
  - `POST /api/v1/admin/quotes/:id/send`
  - `GET /api/v1/admin/invoices`
  - `POST /api/v1/admin/invoices`
  - `POST /api/v1/admin/invoices/from-quote/:quoteId`
  - `GET /api/v1/admin/invoices/:id`
  - `PATCH /api/v1/admin/invoices/:id`
  - `POST /api/v1/admin/invoices/:id/upload-pdf`
  - `GET /api/v1/admin/invoices/:id/pdf`
  - `POST /api/v1/admin/invoices/:id/send-email`
  - `POST /api/v1/admin/invoices/:id/mark-paid`
  - `GET /api/v1/bookings`
  - `GET /api/v1/bookings/:id`
  - `PATCH /api/v1/bookings/:id/status`
  - `GET /api/v1/analytics/overview`
  - `GET /api/v1/audit-logs`

## Environment

The backend reads environment variables from a local `.env` file. The real
`.env` file is ignored by git, so do not commit it and do not paste production
secrets into `.env.example`.

If you do not already have a `.env` file, create one from the safe template:

```bash
test -f .env || cp .env.example .env
```

If `.env` already exists, do not overwrite it. Open `.env.example` and copy only
the missing keys into your local `.env`.

Required variables for the API:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`
- `ADMIN_URL`
- `API_URL`
- `NODE_ENV`
- `PORT`

Production email sending also requires:

- `EMAIL_PROVIDER`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_REPLY_TO`
- `EMAIL_API_KEY` or `RESEND_API_KEY` when `EMAIL_PROVIDER` is a real provider such as `resend`

Production invoice PDF uploads require persistent storage configuration:

- `STORAGE_PROVIDER`
- `STORAGE_LOCAL_ROOT` when `STORAGE_PROVIDER=local`

Optional seed variables:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

For local Supabase development, replace `YOUR_ENCODED_PASSWORD` in
`DATABASE_URL` with your URL-encoded Supabase database password. For example,
encode special characters such as `@`, `#`, `/`, and spaces before placing the
password in the connection string.

Minimum local `.env` shape:

```dotenv
DATABASE_URL=postgresql://postgres.aqoaypumjfxbrlwjtgad:YOUR_ENCODED_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true

JWT_SECRET=ultraspark-local-jwt-secret-change-later-123456789
JWT_EXPIRES_IN=1d

EMAIL_PROVIDER=log
EMAIL_API_KEY=
RESEND_API_KEY=
EMAIL_FROM_NAME=UltraSpark Cleaning
EMAIL_FROM_ADDRESS=info@ultrasparkcleaning.co.uk
EMAIL_REPLY_TO=info@ultrasparkcleaning.co.uk

EMAIL_FROM=UltraSpark Cleaning <info@ultrasparkcleaning.co.uk>
ADMIN_NOTIFICATION_EMAIL=info@ultrasparkcleaning.co.uk

FRONTEND_URL=https://ultrasparkcleaning.co.uk
ADMIN_URL=https://ultraspark.onrender.com
API_URL=http://localhost:4000
APP_BASE_URL=https://ultraspark.onrender.com

STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=./uploads
STORAGE_BUCKET=ultraspark-invoices
STORAGE_PUBLIC_BASE_URL=http://localhost:4000

NODE_ENV=development
PORT=4000

SEED_ADMIN_EMAIL=info@ultrasparkcleaning.co.uk
SEED_ADMIN_PASSWORD=ChangeMe123!
```

If `npm run start:dev` reports missing variables such as `JWT_SECRET` or
`JWT_EXPIRES_IN`, your local `.env` is missing those lines.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Generate the Prisma client:

```bash
npm run prisma:generate
```

3. Run migrations:

```bash
npm run prisma:migrate
```

4. Seed services and optionally a first admin user:

```bash
npm run prisma:seed
```

5. Start the API:

```bash
npm run start:dev
```

The API runs by default at `http://localhost:4000`, with Swagger docs at `http://localhost:4000/api/docs`.

## Build

```bash
npm run build
```

## Testing Endpoints

Example health check:

```bash
curl http://localhost:4000/api/v1/health
```

Example login:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ultrasparkcleaning.co.uk","password":"ChangeMe123!"}'
```

Example public contact submission:

```bash
curl -X POST http://localhost:4000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Sarah",
    "lastName":"Johnson",
    "email":"sarah@example.com",
    "phone":"+447900123456",
    "subject":"Website enquiry",
    "message":"I would like a deep clean quote."
  }'
```

## Framer Form Connection

Point each Framer form submission to the API:

- Contact form -> `POST https://api.ultrasparkcleaning.co.uk/api/v1/contact`
- Quote form -> `POST https://api.ultrasparkcleaning.co.uk/api/v1/quotes`
- Booking form -> `POST https://api.ultrasparkcleaning.co.uk/api/v1/bookings`

Recommended Framer payload fields:

- Contact: `firstName`, `lastName`, `email`, `phone`, `subject`, `message`, `source`
- Quote: `firstName`, `lastName`, `email`, `phone`, `serviceId`, `postcode`, `propertyType`, `bedrooms`, `bathrooms`, `preferredDate`, `details`
- Booking: `firstName`, `lastName`, `email`, `phone`, `serviceId`, `address`, `postcode`, `propertyType`, `bedrooms`, `bathrooms`, `preferredDate`, `preferredTime`, `details`

## Invoice Workflow

Invoices are managed from the admin dashboard and are stored independently from externally generated invoice PDFs, such as PDFs created in Monzo.

1. Create an invoice from `/admin/invoices/new` or from a quote detail page.
2. Link the invoice to a customer and optionally a booking, quote, or support ticket.
3. Upload the generated invoice PDF through the invoice detail page.
4. Send the invoice email from the admin portal. The email can include the payment link and attach the uploaded PDF.
5. Email delivery attempts are saved in `EmailLog`; PDF attachment metadata is saved in `EmailAttachment`.
6. Invoice/customer events are written to `CustomerActivity`, including invoice created, uploaded, sent, paid, and email failed.
7. Mark the invoice paid when payment is confirmed.

If email sending fails, the API stores a failed `EmailLog`, records an `EMAIL_FAILED` customer activity, and returns a safe admin-facing error without exposing provider secrets or stack traces.

## Email Provider Setup

The email layer uses a provider abstraction with Resend implemented.

For staging or smoke tests without a real provider, configure log mode:

```dotenv
EMAIL_PROVIDER=log
EMAIL_FROM_NAME=UltraSpark Cleaning
EMAIL_FROM_ADDRESS=info@ultrasparkcleaning.co.uk
EMAIL_REPLY_TO=info@ultrasparkcleaning.co.uk
```

Log mode treats sends as successful, writes a `SENT` `EmailLog` with provider
`log`, and does not call an external email API.

For production delivery through Resend, configure:

```dotenv
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your_provider_api_key_here
RESEND_API_KEY=your_resend_key_here
EMAIL_FROM_NAME=UltraSpark Cleaning
EMAIL_FROM_ADDRESS=info@ultrasparkcleaning.co.uk
EMAIL_REPLY_TO=info@ultrasparkcleaning.co.uk
```

In production, real providers require a provider API key. If the provider is
set to `log`, quote and invoice emails complete as log-only sends; this is
useful for staging but customers will not receive real email.

If quote email sending fails, check:

- `EMAIL_PROVIDER` is `log` or a supported real provider such as `resend`.
- Real providers have `EMAIL_API_KEY` or `RESEND_API_KEY`.
- `EMAIL_FROM_ADDRESS` and `EMAIL_REPLY_TO` are set to `info@ultrasparkcleaning.co.uk` or the verified sending address.
- The quote has a customer email and at least one line item.
- The latest `EmailLog` for the quote has the safe failure reason.

## Invoice PDF Storage

The storage layer is isolated behind `StorageService`. The first provider is local filesystem storage:

```dotenv
STORAGE_PROVIDER=local
STORAGE_LOCAL_ROOT=/persistent/ultraspark/uploads
STORAGE_PUBLIC_BASE_URL=https://api.ultrasparkcleaning.co.uk
```

For local development, `STORAGE_LOCAL_ROOT=./uploads` is fine. In production, point `STORAGE_LOCAL_ROOT` to a persistent disk or volume. Do not use an ephemeral deployment directory for invoice PDFs. Additional providers such as S3 or Supabase Storage can be added behind the same storage interface later.

Production setup checklist:

- Run Prisma migrations and `npm run prisma:generate`.
- Configure email provider variables.
- Configure invoice PDF storage on a persistent volume.
- Confirm `FRONTEND_URL`, `ADMIN_URL`, `API_URL`, and `APP_BASE_URL` match deployed domains.
- Send a test invoice email from the admin portal and confirm the `EmailLog` and `CustomerActivity` records are created.

## Website Request To Quote Workflow

Website quote form submissions are stored as `QuoteRequest` records. The admin
portal exposes them through protected admin routes without changing the public
form endpoint:

- Public submission: `POST /api/v1/quotes`
- Admin request list: `GET /api/v1/admin/quote-requests`
- Admin request detail: `GET /api/v1/admin/quote-requests/:id`
- Convert request to quote: `POST /api/v1/admin/quote-requests/:id/create-quote`

When a request is converted, the formal `Quote` stores `quoteRequestId`, the
request status is moved to `QUOTED`, and the created quote can be traced back to
the original website request, customer, and selected service. The conversion
endpoint blocks duplicate quote creation from the same request and returns a
clear admin-facing error naming the existing quote number.

Admins can still create quotes manually through `POST /api/v1/admin/quotes`.
Manual quotes simply have no `quoteRequestId`.

Formal quote documents support service-specific `QuoteDocumentType` values:
House Cleaning Quote, Office Cleaning Quote, Deep Cleaning Quote, End of
Tenancy Cleaning Quote, After Builders Cleaning Quote, Commercial Cleaning
Quote, Carpet Cleaning Quote, Move-In / Move-Out Cleaning Quote, and General
Cleaning Quote. Request conversion infers the document type from the selected
service, so an Office Cleaning website request becomes an Office Cleaning Quote
by default. The admin can still change the document type before saving, and the
selected label is used in the admin preview, print output, quote detail view,
and customer quote email.

## Render Deployment

1. Create a PostgreSQL database on Render.
2. Create a new Web Service from this repo.
3. Set the build command:

```bash
npm install && npm run prisma:generate && npm run build
```

4. Set the start command:

```bash
npm run prisma:deploy && npm run start:prod
```

5. Add all environment variables from `.env.example` in the Render dashboard.
6. Set `NODE_ENV=production`.
7. Point `api.ultrasparkcleaning.co.uk` to the Render service using your DNS provider.
8. Run `npm run prisma:seed` once from a Render shell or deploy hook if you want the default services and first admin created automatically.

## Notes

- Public submissions are saved before email is attempted.
- Failed emails are recorded in `EmailLog` and do not roll back the lead.
- Customers do not log in; they are matched internally by email or phone.
