# PROJECT_NOTES.md — Erosae.com Architecture, Setup & Deployment Guide

## 1. Executive Summary & Accomplishments
**Erosae.com** is a production-ready, multi-category e-commerce platform built for single-store merchant inventory with an optimized experience for GCC (Gulf Cooperation Council) and South Asian regional markets.

### Key Milestones Delivered:
1. **Full-Stack Application Architecture:**
   - Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
   - High-speed Server-Side Rendering (SSR) and Static Regeneration (ISR)
   - Mobile-first responsive UI with RTL / Arabic localization readiness

2. **10-Currency Engine with 3-Decimal Precision:**
   - Base prices and financial records stored in USD
   - Dynamic real-time/cached conversion across 10 currencies:
     - `USD` ($), `AED` (د.إ), `SAR` (ر.س), `QAR` (ر.ق), `BDT` (৳), `INR` (₹), `PKR` (₨) — **2 decimal places**
     - `KWD` (د.ك / KD), `OMR` (ر.ع / OMR), `BHD` (.د.ب / BD) — **3 decimal places** (e.g. `KD 1.250`)
   - Internationalized currency formatting with native and Latin symbol toggles

3. **Database Schema & Relational Integrity (Prisma + Hostinger MySQL):**
   - 22+ tables covering users, admin staff, roles & permissions (RBAC), multi-level category hierarchy, products, SKU variants, gallery images, custom fields, persistent shopping bags, orders, payments, coupons, reviews, wishlists, and shipping/tax rules.
   - Soft-deletes (`deletedAt`) on products and orders to preserve financial and audit history.

4. **Modular Admin Panel & Customization Engine:**
   - **Dashboard:** Revenue metrics by regional currency, orders needing attention, low-stock warnings.
   - **CSV Bulk Operations:** One-click CSV export and CSV bulk import engine handling 100–1,000 SKUs with variant attributes, image URLs, and validation error logs.
   - **Dynamic Custom Fields Engine:** Schema-free attribute builder (Text, Number, Select dropdown, Boolean) attached to categories without running SQL migrations.
   - **Fulfillment & Invoicing:** Status transitions (`Pending` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`), tracking number assignment, and print-ready commercial invoices and packing slips.
   - **Role-Based Access Control (RBAC):** Custom staff roles with granular permission checkboxes across modules.

5. **Self-Service & Secure Payment Gateway Hub:**
   - **Pre-Built Gateways:** Stripe (Hosted Elements / Cards, Apple Pay, Google Pay), Cash on Delivery (COD) with regional restriction rules, Direct Bank Wire / Fast Deposit.
   - **Structured Generic Gateway Connector:** Configuration-only form (URLs, Bearer / Header / HMAC auth, payload field mappings) with **zero arbitrary script execution** on your server.
   - **Security:** AES-256-GCM encryption at rest for gateway secrets; key masking (e.g. `••••••••cdef`) in admin UI.

6. **Customer Storefront Experience:**
   - Sticky navbar, debounced live search autocomplete, category mega-menu, currency switcher modal, wishlist counter, persistent slide-out bag.
   - High-impact homepage with hero carousel, category tiles, featured bestsellers, and flash sale banner.
   - Filterable Product Listing Page (PLP) with price range slider and sort options.
   - Product Detail Page (PDP) with multi-image gallery, dynamic variant switcher, stock availability badge, custom fields specifications table, and verified reviews.
   - 4-step accordion checkout flow (Contact -> Shipping -> Shipping Method -> Payment) with instant order confirmation and tracking timeline.

---

## 2. Environment Variables & Secrets Reference

| Variable | Description | Where to Get | Security Note |
|---|---|---|---|
| `DATABASE_URL` | MySQL Connection URI | Hostinger hPanel -> Databases -> MySQL Databases | **Never commit to Git.** Contains database password. |
| `NEXTAUTH_SECRET` | Secret key used to encrypt JWT sessions | Run `openssl rand -base64 32` | Must remain strictly confidential. |
| `NEXTAUTH_URL` | Base public store URL | `https://erosae.com` (or `http://localhost:3000`) | Public configuration. |
| `ENCRYPTION_KEY` | 32-byte hex key for payment secret encryption | Run `openssl rand -hex 32` | **Keep secret.** Used for encrypting 3rd-party gateway keys. |
| `STRIPE_PUBLISHABLE_KEY` | Public key for Stripe browser elements | Stripe Dashboard -> Developers -> API Keys | Safe for client-side HTML. |
| `STRIPE_SECRET_KEY` | Secret key for server-side Stripe charges | Stripe Dashboard -> Developers -> API Keys | **Confidential.** Never expose to clients. |

---

## 3. How to Test Locally in Your Browser

### A. Start the Local Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### B. Customer Storefront Testing Walkthrough:
1. **Currency Switcher:** In the top header, click on the currency badge (default `USD ($)`). Select **`KWD (Kuwaiti Dinar)`**. Notice that all product prices immediately convert and format with **3 decimal places** (e.g., `KD 61.192`). Now switch to **`AED (UAE Dirham)`** or **`SAR`** to see 2 decimal places (`AED 730.83`).
2. **Instant Search:** Type `"Aura"` or `"Oud"` into the search bar. The debounced autocomplete popover will instantly display matching products, images, and prices.
3. **Product Detail Page (PDP):** Click on any product (e.g., *Royal Dehn Al Oud* or *Aura Pro ANC Headphones*). Test switching between variants (e.g., *Obsidian* vs *Silver* or *50ml* vs *100ml*) to see the SKU, price offset, and stock availability update in real-time. Review the *Specifications & Custom Fields* table.
4. **Cart Drawer & Promo Code:** Click **"Add to Bag"**. The slide-out cart will appear. In the promo code box, enter **`WELCOME10`** and click Apply to receive 10% off.
5. **Checkout & Order Placement:** Click **"Proceed to Checkout"**. Fill in your shipping address, choose **Cash on Delivery** or **Stripe**, and click **"Complete Purchase"**.
6. **Order Receipt & Tracking Timeline:** You will be taken to the order confirmation screen with a visual tracking timeline (`Placed` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`). Click **"Print Official Receipt"** to test the commercial invoice.

### C. Merchant Admin Panel Testing Walkthrough:
1. Navigate to **`http://localhost:3000/admin`**.
2. If prompted, sign in with the initial Super Admin credentials:
   - **Email:** `admin@erosae.com`
   - **Password:** `AdminPassword123!`
3. **Dashboard:** Review the gross sales, low-stock warnings, and revenue breakdown cards across all 10 currencies.
4. **CSV Bulk Import:** Go to **Products & CSV**, click **"Import CSV (Bulk)"**, click **"Download Sample Template"**, and test pasting rows to see bulk inventory updates.
5. **Order Management:** Go to **Orders & Shipments**, open your newly placed order, change status to **`SHIPPED`**, enter a courier tracking number (e.g. `ARAMEX-10293847`), and click **Update Order Status**.
6. **Payment Gateways & Custom Connector:** Go to **Payment Gateways** to toggle Stripe/COD or click **"Add Generic Gateway Connector"** to view the structured API connector.
7. **Custom Fields Engine:** Go to **Custom Fields Engine** to define new product attributes (like *"Fabric Material"* or *"Warranty Period"*).
8. **Currency & FX Rates:** Go to **Currency & FX Rates** to manually adjust any exchange rate (e.g., update `1 USD = 3.6725 AED`).

---

## 4. Step-by-Step Hostinger Production Deployment Guide

When you are ready to launch Erosae on your Hostinger account, follow these simple steps:

### Step 1: Create a MySQL Database on Hostinger
1. Log into your **Hostinger hPanel**.
2. Go to **Databases** -> **MySQL Databases**.
3. Create a new database:
   - Database Name: `u123456789_erosae_db`
   - Username: `u123456789_erosae_user`
   - Password: `YourSecurePassword123!`
4. Note your database connection string:
   ```
   mysql://u123456789_erosae_user:YourSecurePassword123!@127.0.0.1:3306/u123456789_erosae_db
   ```

### Step 2: Configure Environment Variables in Hostinger
In your Hostinger VPS, Cloud Hosting, or Node.js application settings, add the environment variables:
- `DATABASE_URL` = your MySQL connection string
- `NEXTAUTH_SECRET` = your generated 32-character secret
- `NEXTAUTH_URL` = `https://erosae.com`
- `ENCRYPTION_KEY` = your 64-character hexadecimal encryption key

### Step 3: Run Database Migrations on Hostinger
In the terminal or build script on Hostinger:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### Step 4: Build & Start Next.js
```bash
npm run build
npm run start
```

### Step 5: Enable Free SSL Certificate
1. In Hostinger hPanel, go to **Websites** -> **SSL**.
2. Click **Install Free Let's Encrypt SSL** for `erosae.com`.
3. Enable **Force HTTPS** toggle.