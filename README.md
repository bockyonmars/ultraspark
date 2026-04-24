# UltraSpark Cleaning Backend

NestJS backend for the UltraSpark Cleaning Framer website. It supports the current production needs only: public lead capture, admin authentication, lead management, email notifications, analytics, audit logs, Swagger docs, and health checks.

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
  - `GET /api/v1/bookings`
  - `GET /api/v1/bookings/:id`
  - `PATCH /api/v1/bookings/:id/status`
  - `GET /api/v1/analytics/overview`
  - `GET /api/v1/audit-logs`

## Environment

Copy `.env.example` to `.env` and set the values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `ADMIN_NOTIFICATION_EMAIL`
- `FRONTEND_URL`
- `ADMIN_URL`
- `API_URL`
- `NODE_ENV`
- `PORT`

Optional seed variables:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

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
