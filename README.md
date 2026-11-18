# CampusMart

A marketplace for one college campus. Seniors who are leaving sell their stuff cheaply, juniors pick up textbooks, cycles and hostel gear, and everyone meets on campus to hand over the item and pay in cash or UPI. There's no in-app chat or payment: buyers tap **Chat on WhatsApp**.

## Features

- **Listings** with up to 4 photos (compressed in the browser, stored on Cloudinary), condition, negotiable price, and an optional "price when new" that shows as **% off**
- **Free items** (price 0), **Reserved** and **Sold** statuses, listings that expire after 30 days and can be renewed
- **Leaving-campus date** on a profile adds a "⏳ Leaving in N days" badge to all that seller's items
- **Seller storefronts** (`/seller/<id>`) with a one-tap shareable list for WhatsApp groups
- **Wanted board**: post what you need; sellers who have it reach out
- **Make an offer**: opens WhatsApp with the offer already written
- Saved items, questions on listings, seller ratings (one per buyer, changeable), reporting
- **Moderation** page for admins (reported listings)
- Optional **verified student** badge, or sign-in restricted to college email domains
- Light/dark theme, mobile bottom navigation, installable as a PWA
- Self-serve **account deletion** (removes listings, photos, questions, requests and ratings)

## Tech

| Part | Stack |
|---|---|
| `client/` | Next.js 16 (App Router), React 19, Tailwind CSS 4, SWR, Google sign-in |
| `server/` | Express, MongoDB (Mongoose), Cloudinary, JWT auth, helmet, rate limiting |

## Running locally

You need Node 20+ and accounts for MongoDB Atlas, Cloudinary and a Google OAuth client.

```bash
cd server
cp .env.example .env    # then fill in the values (see below)
npm install
npm run dev             # http://localhost:5000/api/health
```

```bash
cd client
npm install
npm run dev             # http://localhost:3000
```

Create `client/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same Google client ID as the server>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In the Google Cloud console, add `http://localhost:3000` (and your production URL) as an **Authorized JavaScript origin** for the OAuth client.

## Environment variables

### Server (`server/.env`)

| Variable | Required | What it does |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | ✅ | Long random strings for signing login tokens |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | ✅ | Photo storage |
| `CLIENT_URL` | ✅ in prod | Frontend URL, for CORS (e.g. `https://campusmart.vercel.app`) |
| `ADMIN_EMAILS` | – | Comma-separated Google emails that can open `/admin` |
| `COLLEGE_EMAIL_DOMAINS` | – | e.g. `college.edu`. These users get a **Verified** badge |
| `RESTRICT_TO_COLLEGE_DOMAINS` | – | `true` lets only those domains sign in (admins always can) |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | – | Defaults `15m` and `7d` |
| `PORT`, `NODE_ENV` | – | Defaults `5000` and `development` |

### Client

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_API_URL` | Server URL ending in `/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same Google client ID as the server |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for share previews and the sitemap |

> Never commit `.env` files or credentials. If a secret was ever committed, rotate it: removing the file doesn't remove it from git history.

## Deploying

- **Server → Render** (or any Node host): root directory `server`, build `npm install && npm run build`, start `npm start`. Set the server variables above. The server sets `trust proxy`, so rate limits work behind Render's proxy.
- **Client → Vercel**: root directory `client`. Set the client variables above, with `NEXT_PUBLIC_API_URL` pointing at the Render URL.
- After both are live, set the server's `CLIENT_URL` to the Vercel URL and add that URL to the Google OAuth origins.

On Render's free plan the server sleeps when idle, so the first request after a while takes ~30 seconds. The home page shows a "server might be waking up" message with a retry button in that case.

## Customising for your campus

- **Name and tagline:** `client/src/lib/brand.ts`
- **Colours:** the tokens at the top of `client/src/app/globals.css`
- **Categories:** `LISTING_CATEGORIES` in **both** `client/src/lib/constants.ts` and `server/src/models/Listing.ts`
- **Meet-up spot suggestions:** `CAMPUS_SPOTS` in `client/src/lib/constants.ts`

## Project layout

```
client/src/
  app/            pages (home, listing/[id], sell, saved, wanted, seller/[id], profile, admin, ...)
  components/     ListingCard, ListingForm, Navbar, BottomNav, dialogs, ...
  context/        auth + confirm-dialog providers
  lib/            API client, formatting helpers, constants, types
server/src/
  controllers/    request handlers (listings, users, auth, wanted, ratings, reports, comments)
  models/         Mongoose schemas
  routes/         Express routers
  middleware/     auth, admin guard, error handling, uploads
  utils/          validation and Cloudinary upload/delete helpers
```
