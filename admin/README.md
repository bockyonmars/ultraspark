# UltraSpark Admin Dashboard

Next.js admin dashboard for the UltraSpark Cleaning backend API. This app is focused on the current backend scope only:

- contacts
- quotes
- bookings
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
- customer table plus customer history drawer
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

## Connect The Admin Subdomain

1. In Vercel project settings, add the domain `admin.ultrasparkcleaning.co.uk`.
2. In your DNS provider, create the CNAME or A record that Vercel provides.
3. Wait for SSL to provision.
4. Confirm the backend CORS configuration still allows requests from the admin origin if needed.

## Notes

- The JWT is stored in a secure same-site cookie on the client so middleware can protect routes.
- If the backend returns missing fields, the UI falls back to zeros, `N/A`, or empty states.
- When exact web traffic data is unavailable, the traffic page uses backend submission events as funnel signals.
