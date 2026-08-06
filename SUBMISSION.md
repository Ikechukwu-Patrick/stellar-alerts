# Grandfox / Stellar Grant Submission — Stellar Alerts

## 📌 Executive Summary

**Stellar Alerts** is an open-source, non-custodial, real-time payment monitoring and alert platform built specifically for freelancers, merchants, and decentralized applications operating on the Stellar network.

It bridges the gap between on-chain payment settlement and off-chain user awareness by continuously listening to Stellar Horizon ledger streams and immediately persisting transaction metadata to PostgreSQL while triggering real-time alerts.

---

## 🎯 Problem & Stellar Ecosystem Impact

### The Problem:
Freelancers and business owners receiving XLM or SAC (Soroban Asset Contract) tokens like USDC on Stellar currently face friction:
- Existing wallet user interfaces do not offer configurable real-time push notifications (Telegram, Email, Webhooks).
- Users are forced to manually refresh block explorers or wallet balance screens to verify payment receipts.
- Businesses lack a consolidated, non-custodial transaction ledger for invoice auditing.

### The Solution on Stellar:
- **0-Delay Ingestion**: Listens directly to Stellar Horizon REST & SSE payment streams (`payment` and `create_account` operations).
- **100% Non-Custodial Security**: Requires **only public key addresses** (`G...`). Private/secret keys are never requested or stored anywhere in the application.
- **1-Click Passwordless Authentication**: Passwordless magic-link authentication (`/verify?token=...`) eliminating password vulnerabilities.
- **Multi-Channel Dispatch**: Out-of-band notification engine for Telegram, Email, and custom Webhooks.

---

## ⚙️ Technical Architecture Overview

```
┌─────────────────────────┐
│ Stellar Horizon Network │ (horizon-testnet.stellar.org)
└────────────┬────────────┘
             │ SSE / REST Payment Stream
             ▼
┌─────────────────────────┐
│ Ingestion Worker        │ (watcher.worker.ts)
│ - Validates Public Keys │
│ - Deduplicates txHash   │
└────────────┬────────────┘
             │ Prisma ORM
             ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│ PostgreSQL Database     │◄────┤ Fastify REST API        │
│ (User, Wallet, Payment) │      │ (/auth, /wallets, /pay) │
└─────────────────────────┘      └───────────┬─────────────┘
                                             │ Typed Fetch / NextAuth
                                             ▼
                                 ┌─────────────────────────┐
                                 │ Next.js Web App         │
                                 │ (App Router Dashboard)  │
                                 └─────────────────────────┘
```

---

## 📋 Grant Submission Qualification Matrix

| Requirement | Implementation Details | Status | Verified Artifact |
|---|---|---|---|
| **Open Source License** | MIT License in repository root | ✅ Complete | [LICENSE](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/LICENSE) |
| **Stellar SDK Integration** | Integrated `stellar-sdk` Horizon Server API (`forAccount`, `payments`) | ✅ Complete | [stellar.ts](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/api/src/lib/stellar.ts) |
| **Real-Time Blockchain Worker** | Node background watcher process for payment & `create_account` ingestion | ✅ Complete | [watcher.worker.ts](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/api/src/workers/watcher.worker.ts) |
| **REST API Engine** | Fastify + TypeScript with Zod validation schemas & JWT auth middleware | ✅ Complete | [apps/api/src/app.ts](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/api/src/app.ts) |
| **Non-Custodial Data Model** | PostgreSQL database schema via Prisma ORM for Users, Wallets, & Payments | ✅ Complete | [schema.prisma](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/api/prisma/schema.prisma) |
| **Modern Web Interface** | Next.js (App Router) + Tailwind CSS with dark mode, live stream preview, and dashboard | ✅ Complete | [page.tsx](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/web/src/app/page.tsx) |
| **1-Click Passwordless Auth** | Magic Link email issuance & instant 1-click `/verify` route authentication | ✅ Complete | [verify/page.tsx](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/web/src/app/verify/page.tsx) |
| **Developer Documentation** | Comprehensive architecture document & contributor setup guide | ✅ Complete | [ARCHITECTURE.md](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/ARCHITECTURE.md) |

---

## 🧪 How Reviewers Can Test Live Ingestion

Reviewers can verify real-time Stellar Testnet payment ingestion in 4 steps:

### Step 1: Install & Push Database Schema
```bash
npm install
npm run db:push
```

### Step 2: Launch Fastify API & Next.js Web App
```bash
npm run dev:api   # Listens on http://localhost:3001
npm run dev:web   # Listens on http://localhost:3000
```

### Step 3: Run Ingestion Worker
```bash
npm run dev:worker
```

### Step 4: Trigger Test Payment via Stellar Friendbot
Run our included automated test script to fund a new keypair via Stellar Friendbot and verify payment record insertion:
```bash
npx tsx --env-file=apps/api/.env apps/api/scripts/seed-and-trigger-payment.ts
```

---

## 🚀 Post-Submission Milestone Roadmap

1. **Phase 1 (Completed)**: Core API, Watcher Worker, Prisma Schema, 1-Click Magic Link Auth, Next.js Dashboard.
2. **Phase 2 (Next)**: BullMQ + Redis queue for Telegram Bot alerts & Webhook dispatching.
3. **Phase 3**: Mainnet Horizon switch toggle and Soroban Asset Contract event monitoring.
