# QafNest Ecosystem Master Plan & Roadmap

This document serves as the permanent architectural guide and step-by-step master roadmap for the **QafNest** 3-App Monorepo (`apps/guest`, `apps/host`, `apps/cms`).

---

## 1. Architecture & 3-App Overview

| Application | Folder Path | Local Port | Free Vercel Domain | Core Purpose |
|---|---|---|---|---|
| **1. Guest Platform** | `apps/guest` | `:3000` | `qafnest.vercel.app` | Guests browse chalets, villas, farms & camps, book stays, and pay online. |
| **2. Host Business** | `apps/host` | `:3001` | `business-qafnest.vercel.app` | Property owners list properties, manage dynamic pricing & calendars, and track payouts. |
| **3. Admin CMS** | `apps/cms` | `:3002` | `cms-qafnest.vercel.app` | Super Admins verify hosts & tourism licenses, approve properties, manage blog & payouts. |

---

## 2. Phase-by-Phase Execution Roadmap

### ✅ Phase 1: Monorepo Structure & Environment Setup
- [x] Move existing guest marketplace into `apps/guest`.
- [x] Scaffold `apps/host` (Host Business Portal on Port 3001).
- [x] Scaffold `apps/cms` (Super Admin & CMS Portal on Port 3002).
- [x] Create `packages/shared` for shared TypeScript interfaces, Saudi cities, categories, and Supabase helpers.
- [x] Configure root `package.json` with NPM Workspaces and `concurrently` so `npm run dev` starts all 3 apps simultaneously.
- [x] Connect all 3 apps to the shared Supabase & Firebase environment (`.env.local`).

### 🔜 Phase 2: Central Database Schema & Role-Based Security
- [ ] Add migration in `supabase/migrations/` for:
  - `host_profiles` (KYC, Saudi National ID / Iqama, Ministry of Tourism License, Bank IBAN).
  - `properties` moderation workflow (`status`: `pending`, `approved`, `rejected`, `suspended`).
  - `property_availability` & `property_custom_prices` (weekend/holiday pricing & blocked dates).
  - `payout_requests` (host earnings withdrawal & admin approval).
  - `blog_posts` (dynamic bilingual SEO blog management from CMS).

### 🏢 Phase 3: Host Business Platform (`apps/host`)
- [ ] **Step 3.1**: Host Landing Page & OTP / Email Authentication.
- [ ] **Step 3.2**: 7-Step Property Onboarding Wizard (Category & License, Location & Map Pin, Specs & Pool/Majlis details, Categorized Amenities, Photo/Video Upload, Base/Weekend/Discount Pricing, House Rules).
- [ ] **Step 3.3**: Interactive Host Calendar (block dates & set custom weekend/Eid pricing).
- [ ] **Step 3.4**: Host Bookings Manager, Smart Lock PIN Control & Bank Payout Requests.

### 🛡️ Phase 4: Super Admin CMS (`apps/cms`)
- [ ] **Step 4.1**: Executive Command Center (Total GMV, Bookings, 15% VAT, Pending Approvals).
- [ ] **Step 4.2**: Property & Host Moderation Queue (1-click Approve/Reject that publishes directly to `apps/guest`).
- [ ] **Step 4.3**: Bilingual Blog & SEO Content Manager.
- [ ] **Step 4.4**: Guest Reviews Moderation, Promo Codes & Host Payout Disbursement.

### 🌐 Phase 5: Guest Platform (`apps/guest`) Final Sync
- [ ] Real-time sync with Host Calendar blocked dates & custom weekend prices.
- [ ] Direct WhatsApp Host contact on confirmed bookings.
- [ ] Downloadable ZATCA 15% VAT Invoice & PDF Booking Voucher.

### 🚀 Phase 6: Vercel Deployment
- [ ] Connect single GitHub repository to 3 Vercel projects using Root Directory (`apps/guest`, `apps/host`, `apps/cms`).

---

## 3. Daily Commands Cheat Sheet

- `npm run dev` — Run all 3 apps simultaneously (`:3000`, `:3001`, `:3002`)
- `npm run dev:guest` — Run Guest App only (`http://localhost:3000`)
- `npm run dev:host` — Run Host Business App only (`http://localhost:3001`)
- `npm run dev:cms` — Run Super Admin CMS only (`http://localhost:3002`)
- `npm run build` — Build all 3 applications
