# Artify — Artisan Handmade Marketplace

Artify is a production-quality MVP prototype of an online marketplace built to empower street artisans, clay sculptors, wood craftsmen, and handloom weavers. The platform features artisan storytelling, seller activation flows, catalog browsers with fuzzy search, cart checkouts, simulated online transactions (COD/UPI/Card), order delivery status timelines, and product reviews.

---

## 📁 Project Folder Structure

```
artify-workspace/
├── schema.sql                   # Supabase / PostgreSQL database tables & seed data
├── backend/                     # Express REST API Backend
│   ├── config/
│   │   └── supabase.js          # Supabase JS SDK connection initialization
│   ├── middleware/
│   │   └── auth.js              # JWT security & role-based validation middleware
│   ├── routes/
│   │   ├── auth.js              # Signin, signup, profile endpoints
│   │   ├── products.js          # Browsing, filters, and seller product CRUD
│   │   ├── orders.js            # Checkout, fulfillment list, review submissions
│   │   ├── seller.js            # Seller profile edits and dashboard analytics
│   │   └── admin.js             # Platform analytics, seller approvals, users manager
│   ├── .env.example             # Template for API keys and configuration ports
│   ├── server.js                # Express server entry point
│   └── package.json
└── frontend/                    # Next.js App Router Frontend (React + Tailwind CSS v4)
    ├── app/
    │   ├── globals.css          # Tailwind CSS v4 custom theme & typography setup
    │   ├── layout.js            # Root layout importing fonts, Providers, Navbar, Footer
    │   ├── page.js              # Earthy themed homepage & spotlights
    │   ├── login/               # Sign-in/Sign-up forms
    │   ├── products/            # Catalog shop catalog & filters
    │   │   ├── page.js
    │   │   └── [id]/            # Detailed story & review submissions
    │   ├── cart/                # Cart listing & mock checkout billing
    │   └── dashboard/           # User dashboard panel pages
    │       ├── admin/           # Platform overview, seller verify, users list
    │       ├── seller/          # Payout accounts, shop catalog, order fulfillments
    │       └── customer/        # Orders history, wishlist, delivery status tracker
    ├── context/
    │   └── AppContext.js        # React state Provider for cart, auth sessions, and toasts
    ├── components/
    │   ├── Navbar.js            # Dynamic header navigation bar
    │   ├── Footer.js            # Earthy footer with categories & story links
    │   └── NotificationToast.js # Smooth toast popup drawer
    └── package.json
```

---

## 🚀 How to Run Locally

### 1. Database Setup (Supabase)
1. Create a free project on [Supabase](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of [schema.sql](file:///c:/DM/schema.sql) and click **Run**. This will generate the necessary tables, indexes, and insert default demo data (users, profiles, and products).

### 2. Configure Backend Environment
1. Navigate to `/backend`.
2. Create a file named `.env` and copy the template:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-or-service-role-key
   JWT_SECRET=artify_secret_session_token_key_2026
   PLATFORM_COMMISSION_PERCENT=10
   ```
3. Replace the `SUPABASE_URL` and `SUPABASE_KEY` with your actual Supabase API keys (found in Project Settings -> API).

### 3. Start the Backend API Server
```bash
cd backend
npm run dev
```
The backend service will boot on `http://localhost:5000`. You can test connection health by visiting `http://localhost:5000/` in your browser.

### 4. Start the Frontend Dev Server
In a new terminal window:
```bash
cd frontend
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with the Artify application.

---

## 👥 Demo Logins (Default Password: `password123`)

For grading, evaluation, and manual testing, we have preloaded the database seed with the following test credentials:

| Role | Email | Purpose |
| :--- | :--- | :--- |
| **Admin** | `admin@artify.com` | Approves pending sellers, manages users, views global earnings |
| **Seller 1** | `suresh@artify.com` | Manages "Kumhar Gram Terracotta", uploads clay cookware, updates orders |
| **Seller 2** | `radha@artify.com` | Manages "Radha Handlooms", spins organic textiles |
| **Customer** | `customer@artify.com` | Browses products, adds items to cart, checks out, tracks deliveries, writes reviews |

---

## 🔒 Security & Best Practices Built-in
* **Earthy Aesthetics:** Leverages Tailwind CSS v4 variables to establish a soft clay/terracotta theme with premium modern shadows and borders matching the Etsy style.
* **Security:** Passwords hashed with `bcryptjs`, REST routes secured using JWT token exchange in Authorization headers.
* **Platform Fee Split:** Automatic calculation of a 10% commission fee on checkouts, showing net payouts to the seller on their analytics screen.
* **Storytelling Focus:** Dedicates spaces on the catalog, detail pages, and dashboards to emphasize the location and background journey of every single street artisan.
