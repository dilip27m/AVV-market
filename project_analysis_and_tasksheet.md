# 🏪 Campus Marketplace — Project Analysis & Task Sheet

---

## 1. Idea Analysis

### What's Strong

| Aspect | Why It Works |
|---|---|
| **Hyper-local focus** | Buying/selling within a campus removes trust, delivery, and payment friction — the biggest pain points of general marketplaces. |
| **No payment gateway** | Smart. Cash/UPI at hostel eliminates an entire layer of complexity (compliance, refunds, disputes). |
| **Seller = Buyer** | Single user type keeps the data model and UX dead simple. |
| **Hostel-level location** | This is *more useful* than city-level location on OLX. Students can literally walk over. |
| **Seller ratings** | Builds lightweight trust without needing verification documents. |
| **Contact-outside-app** | Phone/WhatsApp contact avoids building a real-time chat system. |

### Potential Risks & How to Mitigate

| Risk | Mitigation |
|---|---|
| **Spam listings** (no campus-email gate) | Add a "Report Listing" feature (you already planned this ✅) + simple admin moderation panel in V2. |
| **Stale listings** | Auto-expire listings after 30 days with a "Renew" prompt. Mark inactive sellers' items as stale. |
| **Fake ratings** | Only allow rating if the buyer viewed the seller's contact (lightweight gating). |
| **Low initial content** | Seed with 15–20 real listings yourself before launch. A marketplace with zero items is dead on arrival. |
| **Non-students signing up** (open Google login) | Not a real problem at campus scale. If needed later, add optional college email verification for a "Verified Student" badge. |

---

## 2. Suggestions & Improvements

### ✅ Accept These (Low Effort, High Impact)

#### 1. **Auto-expire listings after 30 days**
Stale listings kill trust. Add a `expiresAt` field to listings. Show a "Renew" button 3 days before expiry. After expiry, move to an `EXPIRED` status (hidden from browse, visible in "My Listings").

#### 2. **WhatsApp deep link instead of just phone number**
Instead of showing a raw phone number, add a **"Chat on WhatsApp"** button that opens `https://wa.me/91XXXXXXXXXX?text=Hi, I'm interested in your {item_name} listed on CampusMart`. This is how 90% of campus deals actually happen.

#### 3. **Image compression on upload**
Students will upload 5MB photos from their phone cameras. Compress to ~300KB on the client side before uploading to Cloudinary. Saves bandwidth and Cloudinary quota.

#### 4. **"Negotiable" price tag**
Add a simple toggle: `☐ Price is negotiable`. Students *always* negotiate. This sets expectations upfront.

#### 5. **Sort options on browse**
- Newest first (default)
- Price: Low → High
- Price: High → Low
- Seller rating

#### 6. **Share listing button**
A simple "Copy Link" or "Share on WhatsApp" for individual listings. Students will share in hostel groups — **free distribution**.

### 🟡 Consider These (Medium Effort)

#### 7. **Verified Student badge (optional)**
Let users optionally link a `.edu` email for a ✅ badge. Don't enforce it — just reward it.

#### 8. **Listing description field**
Your current schema doesn't have a `description` field. Even a simple optional textarea ("Any details you want to add?") helps for electronics/books where condition matters.

#### 9. **Item condition selector**
A simple dropdown: `New / Like New / Used - Good / Used - Fair`. Especially useful for electronics & books.

### ❌ Skip These for V1

- Wishlist / Saved items
- Push notifications  
- In-app chat
- Payment integration
- Complex admin dashboard
- AI recommendations

---

## 3. Final Tech Stack

```
Frontend:       Next.js 15 (App Router) + TypeScript + Tailwind CSS v3
Backend:        Express.js + TypeScript
Auth:           Google OAuth 2.0 → JWT (access + refresh tokens)
Database:       MongoDB Atlas + Mongoose
Images:         Cloudinary (with client-side compression via browser-image-compression)
Deployment:     Vercel (frontend) + Railway (backend)
```

---

## 4. Database Schema (Refined)

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,              // from Google profile
  email: String,             // Google email (unique)
  googleId: String,          // Google OAuth ID (unique)
  profileImage: String,      // Google profile photo URL
  phone: String,             // user sets on first listing
  hostel: String,            // user sets on profile
  averageRating: Number,     // default 0
  totalRatings: Number,      // default 0
  totalItemsSold: Number,    // default 0
  createdAt: Date,
  updatedAt: Date
}
```

### Listings Collection

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,        // ref → Users
  title: String,
  description: String,       // optional
  images: [String],          // Cloudinary URLs (max 5)
  category: String,          // enum of categories
  price: Number,
  isNegotiable: Boolean,     // default false
  condition: String,         // enum: NEW, LIKE_NEW, GOOD, FAIR
  sellerName: String,        // denormalized for perf
  sellerPhone: String,       // denormalized
  hostel: String,            // collection location
  status: String,            // enum: ACTIVE, SOLD, EXPIRED, DELETED
  expiresAt: Date,           // auto-set to createdAt + 30 days
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ status: 1, category: 1, createdAt: -1 }`, `{ sellerId: 1 }`, text index on `title`

### Ratings Collection

```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,        // ref → Users (who is being rated)
  raterId: ObjectId,         // ref → Users (who is rating)
  rating: Number,            // 1-5
  createdAt: Date
}
```

**Unique compound index:** `{ sellerId: 1, raterId: 1 }` — one rating per buyer per seller.

### Reports Collection

```javascript
{
  _id: ObjectId,
  listingId: ObjectId,       // ref → Listings
  reporterId: ObjectId,      // ref → Users
  reason: String,            // enum: WRONG_INFO, SPAM, INAPPROPRIATE, ALREADY_SOLD, OTHER
  description: String,       // optional extra detail
  status: String,            // enum: PENDING, REVIEWED, DISMISSED
  createdAt: Date
}
```

---

## 5. Project Structure

```
AVV-market/
├── client/                          # Next.js 15 frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx
│   │   │   ├── (main)/
│   │   │   │   ├── page.tsx         # Home / Browse
│   │   │   │   ├── listing/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx # Item detail
│   │   │   │   │   └── new/
│   │   │   │   │       └── page.tsx # Create listing
│   │   │   │   ├── my-listings/
│   │   │   │   │   └── page.tsx     # My listings
│   │   │   │   ├── profile/
│   │   │   │   │   ├── page.tsx     # Own profile
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Seller profile
│   │   │   │   └── layout.tsx       # Main layout w/ nav
│   │   │   ├── layout.tsx           # Root layout
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── ListingCard.tsx
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   └── Navbar.tsx
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios/fetch wrapper
│   │   │   ├── auth.ts              # Auth helpers
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useListings.ts
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript types
│   │   └── context/
│   │       └── AuthContext.tsx
│   ├── public/
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Express.js backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                # MongoDB connection
│   │   │   ├── cloudinary.ts        # Cloudinary config
│   │   │   └── env.ts               # Environment variables
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Listing.ts
│   │   │   ├── Rating.ts
│   │   │   └── Report.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── listing.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── rating.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── listing.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── rating.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   ├── upload.middleware.ts  # Multer + Cloudinary
│   │   │   └── error.middleware.ts
│   │   ├── utils/
│   │   │   └── helpers.ts
│   │   └── index.ts                 # Express app entry
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example                     # Template for all env vars
├── .gitignore
└── README.md
```

---

## 6. API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login/signup |
| GET | `/api/auth/me` | Get current user from JWT |
| POST | `/api/auth/refresh` | Refresh access token |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Browse listings (paginated, filterable) |
| GET | `/api/listings/:id` | Get single listing |
| POST | `/api/listings` | Create listing (auth required) |
| PUT | `/api/listings/:id` | Edit listing (owner only) |
| PATCH | `/api/listings/:id/status` | Mark as sold/active (owner only) |
| DELETE | `/api/listings/:id` | Soft-delete listing (owner only) |
| GET | `/api/listings/my` | Get current user's listings |
| GET | `/api/listings/search?q=` | Text search |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/me` | Update own profile |
| GET | `/api/users/:id/listings` | Get user's active listings |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ratings` | Rate a seller |
| GET | `/api/ratings/:sellerId` | Get seller's ratings |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Report a listing |

---

## 7. Development Guidelines

> [!IMPORTANT]
> **These guidelines must be followed by all developers and AI agents working on this project.**

### Code Quality

1. **TypeScript everywhere.** No `any` types unless absolutely necessary. Define proper interfaces in `types/index.ts`.
2. **Consistent naming.** Files: `kebab-case`. Components: `PascalCase`. Functions/variables: `camelCase`. DB fields: `camelCase`.
3. **One component per file.** Keep components focused. If a component exceeds ~150 lines, break it up.
4. **Descriptive variable names.** `listingData` not `data`. `isLoading` not `loading`. `handleSubmit` not `submit`.
5. **Error handling everywhere.** Every API call must have try/catch. Every Express route must pass errors to the error middleware. Never swallow errors silently.
6. **No hardcoded values.** URLs, API keys, category lists, etc. go in config files or environment variables.
7. **Comments for WHY, not WHAT.** Don't comment `// increment counter`. Do comment `// expire after 30 days to prevent stale listings`.

### Architecture

8. **Separation of concerns.** Routes → Controllers → Models. Routes only parse requests. Controllers hold logic. Models define data.
9. **Validate all inputs.** Use `zod` or `express-validator` on the backend. Validate on the frontend too, but **never trust the client**.
10. **Consistent API responses.** Always return `{ success: boolean, data?: any, message?: string, error?: string }`.
11. **Pagination on all list endpoints.** Default: 20 items per page. Use cursor-based or skip/limit pagination.
12. **Environment variables.** Use `.env` files. Never commit secrets. Provide a `.env.example` with all required keys.

### Frontend Specific

13. **Loading states for every async operation.** Show skeletons or spinners, never a blank screen.
14. **Optimistic UI where possible.** Mark as sold → update UI immediately → sync with server.
15. **Responsive design.** Mobile-first. Most students will use phones. Test at 375px, 768px, and 1024px.
16. **Accessible.** Use semantic HTML, proper labels, alt text on images, keyboard navigation.
17. **Client-side image compression.** Compress images to ≤300KB before uploading using `browser-image-compression`.

### Backend Specific

18. **Authentication middleware on all protected routes.** Never trust the frontend to gate access.
19. **Authorization checks.** A user can only edit/delete their OWN listings. Check `sellerId === req.user.id` in controllers.
20. **Rate limiting.** Apply to auth endpoints and listing creation (e.g., max 10 listings per hour per user).
21. **CORS configuration.** Only allow requests from your frontend domain.
22. **Soft deletes.** Don't actually remove data from MongoDB. Set `status: 'DELETED'` and filter in queries.

### Git & Workflow

23. **Meaningful commit messages.** `feat: add listing creation form` not `update`.
24. **Branch per feature.** `feat/google-auth`, `feat/listing-crud`, `feat/seller-ratings`.
25. **Test before merging.** At minimum, manually test the happy path + one error case.

---

## 8. Task Sheet — Phased Development

### Phase 0: Project Setup (Day 1)
| # | Task | Details |
|---|------|---------|
| 0.1 | Initialize Next.js frontend | `npx create-next-app@latest ./client` with TypeScript, Tailwind, App Router, ESLint |
| 0.2 | Initialize Express backend | Set up `server/` with TypeScript, nodemon, ts-node |
| 0.3 | Set up MongoDB connection | Mongoose connection in `server/src/config/db.ts`, test with Atlas |
| 0.4 | Create `.env.example` | List all required env vars for both client and server |
| 0.5 | Set up `.gitignore` | Ignore `node_modules`, `.env`, `.next`, `dist` |
| 0.6 | Configure CORS + JSON parsing | Express middleware setup |
| 0.7 | Set up Cloudinary account | Create account, get API key/secret, configure in backend |
| 0.8 | Set up Google Cloud OAuth | Create project, configure consent screen, get client ID/secret |

### Phase 1: Authentication (Days 2–3)
| # | Task | Details |
|---|------|---------|
| 1.1 | Create `User` Mongoose model | Schema with all fields, indexes on `email` and `googleId` |
| 1.2 | Build Google OAuth backend flow | `POST /api/auth/google` — verify Google token, create/find user, return JWT |
| 1.3 | JWT middleware | Verify access token, attach `req.user`, handle expired tokens |
| 1.4 | Refresh token endpoint | `POST /api/auth/refresh` with httpOnly cookie |
| 1.5 | `GET /api/auth/me` endpoint | Return current user from JWT |
| 1.6 | Frontend: Google login button | Use `@react-oauth/google` package |
| 1.7 | Frontend: Auth context & provider | Store user state, JWT, login/logout functions |
| 1.8 | Frontend: Login page UI | Clean login page with Google sign-in button |
| 1.9 | Frontend: Protected route wrapper | Redirect to login if not authenticated |
| 1.10 | Frontend: Profile completion flow | After first login, prompt for phone + hostel |

### Phase 2: Listing CRUD — Backend (Days 4–5)
| # | Task | Details |
|---|------|---------|
| 2.1 | Create `Listing` Mongoose model | Schema with all fields, indexes, text index on `title` |
| 2.2 | Image upload middleware | Multer → Cloudinary upload, return URLs |
| 2.3 | `POST /api/listings` | Create listing with image upload, set `expiresAt` to +30 days |
| 2.4 | `GET /api/listings` | Paginated browse with filters: category, status, sort, search |
| 2.5 | `GET /api/listings/:id` | Single listing with seller info populated |
| 2.6 | `PUT /api/listings/:id` | Edit listing (owner only), allow image add/remove |
| 2.7 | `PATCH /api/listings/:id/status` | Toggle ACTIVE ↔ SOLD (owner only) |
| 2.8 | `DELETE /api/listings/:id` | Soft delete — set status to DELETED (owner only) |
| 2.9 | `GET /api/listings/my` | Current user's listings (all statuses) |
| 2.10 | `GET /api/listings/search` | Text search on title field |
| 2.11 | Input validation | Add `zod` schemas for all listing endpoints |

### Phase 3: Listing UI — Frontend (Days 6–8)
| # | Task | Details |
|---|------|---------|
| 3.1 | Design system & global styles | Color palette, typography, spacing, component tokens in Tailwind config |
| 3.2 | `Navbar` component | Logo, search, profile avatar, sell button |
| 3.3 | `CategoryGrid` component | Horizontal scrollable category pills with emojis |
| 3.4 | `ListingCard` component | Image, title, price, seller rating, hostel badge |
| 3.5 | `SearchBar` component | With debounced search, filters dropdown |
| 3.6 | **Home page** | Search + categories + recently listed grid (responsive) |
| 3.7 | `ImageUploader` component | Drag-drop / click, preview thumbnails, client-side compression, max 5 |
| 3.8 | **Create Listing page** | Full form with image upload, category select, condition, negotiable toggle |
| 3.9 | **Item Detail page** | Image carousel, all listing info, seller info card, contact buttons (call + WhatsApp) |
| 3.10 | **My Listings page** | List with status badges, edit/sold/delete action buttons |
| 3.11 | Edit listing flow | Pre-filled form, image management |
| 3.12 | Category filter page | Browse filtered by selected category |
| 3.13 | Empty states | Design empty states for "no listings", "no results", etc. |
| 3.14 | Loading skeletons | Skeleton loaders for listing cards, detail page |

### Phase 4: User Profiles & Ratings (Days 9–10)
| # | Task | Details |
|---|------|---------|
| 4.1 | Create `Rating` Mongoose model | Schema with unique compound index |
| 4.2 | `POST /api/ratings` | Submit rating (1-5), update seller's `averageRating` and `totalRatings` |
| 4.3 | `GET /api/ratings/:sellerId` | Get all ratings for a seller |
| 4.4 | `GET /api/users/:id` | Public seller profile endpoint |
| 4.5 | `PUT /api/users/me` | Update own profile (phone, hostel, name) |
| 4.6 | `GET /api/users/:id/listings` | Get a seller's active listings |
| 4.7 | `RatingStars` component | Interactive star rating input + display |
| 4.8 | **Seller Profile page** | Name, photo, rating, items sold, active listings |
| 4.9 | **Own Profile page** | Editable profile with stats |
| 4.10 | Rate seller modal/page | Star rating submission after viewing contact |

### Phase 5: Reports & Polish (Days 11–12)
| # | Task | Details |
|---|------|---------|
| 5.1 | Create `Report` Mongoose model | Schema for reports |
| 5.2 | `POST /api/reports` | Submit report on a listing |
| 5.3 | Report listing modal | Reason selector + optional description |
| 5.4 | Share listing button | Copy link + WhatsApp share |
| 5.5 | Sort/filter controls on browse | Sort by price, date, rating |
| 5.6 | Toast notifications | Success/error toasts for all user actions |
| 5.7 | 404 and error pages | Proper error boundary pages |
| 5.8 | SEO meta tags | Title, description, OG tags per page |
| 5.9 | Mobile responsiveness pass | Test and fix all pages at 375px |
| 5.10 | Performance audit | Image lazy loading, code splitting, Lighthouse check |

### Phase 6: Deployment (Days 13–14)
| # | Task | Details |
|---|------|---------|
| 6.1 | Prepare backend for production | Build step, environment config, health check endpoint |
| 6.2 | Deploy backend to Railway | Connect repo, set env vars, configure domain |
| 6.3 | Deploy frontend to Vercel | Connect repo, set env vars, configure domain |
| 6.4 | Configure custom domain (if any) | DNS setup |
| 6.5 | Test full flow in production | Login → browse → create listing → view → contact → rate |
| 6.6 | Seed initial data | Add 15–20 real/realistic listings to avoid empty marketplace |
| 6.7 | Write README.md | Setup instructions, env vars, architecture overview |

---

## 9. Future Ideas (Post-MVP)

> [!NOTE]
> **Only build these AFTER the MVP is live and students are actively using it.** Prioritize based on real user feedback.

### 🟢 High Priority (V2)

| Feature | Why |
|---------|-----|
| **Push notifications** | "Your listing has expired", "Someone rated you" |
| **Wishlist / Save for later** | Students browse in class, buy at hostel |
| **Admin moderation panel** | Review reported listings, ban abusers |
| **Listing renewal** | One-click "Renew for 30 more days" |
| **Analytics dashboard** | Total listings, active users, popular categories — for YOU, not users |

### 🟡 Medium Priority (V3)

| Feature | Why |
|---------|-----|
| **In-app chat** | Replace phone contact with in-app messaging (Socket.IO) |
| **Verified Student badge** | Optional `.edu` email verification |
| **Price drop alerts** | Notify wishlist users when price drops |
| **Image galleries** | Multiple photos with swipe carousel |
| **Similar items** | "You might also like" based on category |

### 🔴 Long Term (V4+)

| Feature | Why |
|---------|-----|
| **Multi-campus support** | Expand to other campuses (each as a separate marketplace) |
| **Alumni marketplace** | Let alumni sell/donate to current students |
| **Request board** | "Looking for a mattress" — reverse marketplace |
| **Seasonal surge features** | Auto-create "End of Semester Sale" events |
| **Mobile app** | React Native wrapper once web traffic justifies it |
| **UPI integration** | Optional in-app payments (only if users demand it) |

---

## 10. Quick Reference — Environment Variables

```env
# === Server ===
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:3000

# === Client ===
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

> [!TIP]
> **Launch strategy:** Before going live, seed the marketplace with 15–20 real listings (your own stuff, friends' stuff). Share the link in your batch WhatsApp groups. A marketplace with zero listings is a dead marketplace — the first 48 hours matter.
