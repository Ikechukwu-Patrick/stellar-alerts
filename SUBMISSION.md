# Drips Wave & Stellar Grant Submission — Stellar Alerts

## 📌 Executive Summary

**Stellar Alerts** is an open-source, non-custodial, real-time payment monitoring, Soroban contract event tracker, and alert platform built specifically for freelancers, merchants, and decentralized applications operating on the Stellar network.

It bridges the gap between on-chain payment settlement and off-chain user awareness by continuously listening to Stellar Horizon SSE ledger streams and Soroban RPC contract events, persisting transaction metadata to PostgreSQL while triggering real-time alerts.

---

## 🎯 Problem & Stellar Ecosystem Impact

### The Problem:
Freelancers and business owners receiving XLM or Soroban Asset Contract (SAC) tokens like USDC on Stellar currently face friction:
- Existing wallet user interfaces do not offer configurable real-time push notifications (Telegram, Email, Webhooks).
- Users are forced to manually refresh block explorers or wallet balance screens to verify payment receipts.
- Businesses lack a consolidated, non-custodial transaction ledger for invoice auditing.

### The Solution on Stellar:
- **0-Delay SSE Ingestion**: Listens directly to Stellar Horizon SSE payment streams (`payment` and `create_account` operations).
- **Soroban Wasm Integration**: Ingests Soroban contract events (`getEvents`) and includes an on-chain Rust Wasm Alert Registry contract (`contracts/alert_registry`).
- **100% Non-Custodial Security**: Requires **only public key addresses** (`G...`) with StrKey CRC16 checksum validation. Private/secret keys are never requested or stored.
- **BullMQ Redis Queue**: Asynchronous alert queue with exponential retry backoff (5 attempts).
- **HMAC SHA256 Webhook Signer**: Generates cryptographically verifiable `X-Stellar-Alerts-Signature` headers.
- **1-Click Passwordless Authentication**: Passwordless magic-link authentication (`/verify?token=...`).

---

## ⚙️ Technical Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│ Stellar Horizon SSE & Soroban RPC Event Streams         │
└───────────────────────────┬────────────────────────────┘
                            │ Real-Time Stream
                            ▼
┌────────────────────────────────────────────────────────┐
│ Ingestion Worker (watcher.worker.ts)                   │
│ - StrKey Checksum Guard                                │
│ - Idempotent Deduplication (txHash)                    │
└────────────┬─────────────────────────────┬─────────────┘
             │ Prisma ORM                  │ BullMQ
             ▼                             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│ PostgreSQL Database     │   │ Redis Alert Queue        │
│ (User, Wallet, Payment) │   │ (Telegram/Email/Webhooks)│
└────────────┬────────────┘   └──────────────────────────┘
             │
             ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│ Fastify REST API        │◄──┤ Next.js Web App          │
│ (/auth, /wallets, /pay) │   │ (App Router Dashboard)   │
└─────────────────────────┘   └──────────────────────────┘
```

---

## 📋 Grant Submission Qualification Matrix

| Requirement | Implementation Details | Status | Verified Artifact |
|---|---|---|---|
| **Open Source License** | MIT License in repository root | ✅ Complete | [LICENSE](LICENSE) |
| **Stellar SDK Integration** | Integrated `stellar-sdk` Horizon Server API (`forAccount`, `payments`) & Soroban RPC | ✅ Complete | [stellar.ts](apps/api/src/lib/stellar.ts) |
| **Real-Time Blockchain Worker** | Node background watcher process for SSE stream & `create_account` ingestion | ✅ Complete | [watcher.worker.ts](apps/api/src/workers/watcher.worker.ts) |
| **Soroban Smart Contract** | On-chain Rust Wasm Alert Registry smart contract | ✅ Complete | [lib.rs](contracts/alert_registry/src/lib.rs) |
| **REST API Engine** | Fastify + TypeScript with Zod validation schemas & JWT auth middleware | ✅ Complete | [app.ts](apps/api/src/app.ts) |
| **Automated Testing** | Vitest unit test suite with 100% passing rate | ✅ Complete | [vitest.config.ts](apps/api/vitest.config.ts) |
| **CI/CD Pipeline** | GitHub Actions workflow for build, typecheck, and test | ✅ Complete | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
| **Non-Custodial Data Model** | PostgreSQL database schema via Prisma ORM for Users, Wallets, & Payments | ✅ Complete | [schema.prisma](apps/api/prisma/schema.prisma) |
| **Modern Web Interface** | Next.js (App Router) + Tailwind CSS with dark mode, live stream preview, and dashboard | ✅ Complete | [page.tsx](apps/web/src/app/page.tsx) |
| **1-Click Passwordless Auth** | Magic Link email issuance & instant 1-click `/verify` route authentication | ✅ Complete | [verify/page.tsx](apps/web/src/app/verify/page.tsx) |
| **Developer Documentation** | Comprehensive architecture document, audit report, and contributor setup guide | ✅ Complete | [ARCHITECTURE.md](ARCHITECTURE.md) |

---

## 🧪 How Reviewers Can Test Live Ingestion

Reviewers can verify real-time Stellar Testnet payment ingestion in 4 steps:

### Step 1: Monorepo Install & Local Docker Stack
```bash
npm install
docker compose up -d
npm run db:push
```

### Step 2: Run Unit Tests & Typechecks
```bash
npm run test:api
```

### Step 3: Launch Monorepo Stack
```bash
npx turbo dev
```

### Step 4: Trigger Test Payment via Stellar Friendbot
Run our included automated test script to fund a new keypair via Stellar Friendbot and verify payment record insertion:
```bash
npx tsx --env-file=apps/api/.env apps/api/scripts/seed-and-trigger-payment.ts
```
