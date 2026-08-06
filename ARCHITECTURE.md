# Stellar Payment Tracker — Architecture

## 1. Overview

Stellar Alerts is an open-source real-time payment tracker and alert system for Stellar wallets. It monitors registered Stellar public keys for incoming payment operations on the Stellar network (Testnet / Mainnet) via real-time Horizon Server-Sent Events (SSE) streams and Soroban RPC event queries. It records payment history in PostgreSQL via Prisma ORM and dispatches off-chain alerts (Telegram, Email, Webhooks) asynchronously via BullMQ and Redis.

Data flows in one direction:

```
Stellar Network (Horizon SSE + Soroban RPC) → Ingestion Worker → PostgreSQL → Fastify REST API → Next.js Web App
                                                    │
                                                    └──> BullMQ (Redis) → Telegram / Email / Webhook Alerts
```

The Next.js web application never communicates with Stellar directly. It consumes the typed Fastify REST API, utilizing shared DTO interfaces exported by `@stellar-alerts/shared`.

---

## 2. Tech Stack & Implementation Matrix

| Layer            | Choice                                   | Status |
|-------------------|-------------------------------------------|--------|
| Backend framework | Fastify + TypeScript                      | ✅ Implemented |
| Frontend framework| Next.js (App Router) + Tailwind CSS       | ✅ Implemented |
| Monorepo & Shared | Turborepo + `@stellar-alerts/shared`      | ✅ Implemented |
| Database & ORM    | PostgreSQL + Prisma ORM                   | ✅ Implemented |
| Blockchain SDK    | `stellar-sdk` (Horizon REST/SSE + Soroban RPC) | ✅ Implemented |
| Ingestion Worker  | Real-Time SSE Stream Watcher (`watcher.worker.ts`) | ✅ Implemented |
| Smart Contract    | Soroban Rust Wasm Contract (`contracts/alert_registry`) | ✅ Implemented |
| Job Queue         | BullMQ + Redis                            | ✅ Implemented |
| Webhook Security  | HMAC SHA256 Cryptographic Signatures      | ✅ Implemented |
| Auth Engine       | Passwordless Magic Link + JWT Session      | ✅ Implemented |
| Automated Testing | Vitest (`npm run test:api`)               | ✅ Implemented |
| CI/CD Automation  | GitHub Actions (`.github/workflows/ci.yml`) | ✅ Implemented |

---

## 3. Monorepo Directory Architecture

```
stellar-alerts/
├── .github/
│   ├── ISSUE_TEMPLATE/           # Feature Request & Bug Report YAML forms
│   ├── PULL_REQUEST_TEMPLATE.md  # Standardized PR template
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI build & test pipeline
├── apps/
│   ├── api/                      # Fastify REST API & Horizon/Soroban Worker
│   │   ├── src/
│   │   │   ├── app.ts            # Fastify instance, CORS & plugin registration
│   │   │   ├── server.ts         # Fastify HTTP server entry point
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts     # Prisma ORM singleton instance
│   │   │   │   ├── queue.ts      # BullMQ payment-alerts Redis queue
│   │   │   │   ├── soroban.ts    # Soroban RPC client & contract event parser
│   │   │   │   └── stellar.ts    # Horizon API client & StrKey checksum guard
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Magic link issuance & verification
│   │   │   │   ├── wallets/      # Wallet registration & management
│   │   │   │   └── payments/     # Payment history & aggregate stats
│   │   │   ├── utils/
│   │   │   │   ├── jwt.ts        # Magic & Session JWT signing/verification
│   │   │   │   └── webhook-signer.ts # HMAC SHA256 webhook signature generator
│   │   │   └── workers/
│   │   │       └── watcher.worker.ts # Horizon SSE real-time stream watcher
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Data models for User, Wallet, Payment
│   │   └── vitest.config.ts      # Vitest test configuration
│   └── web/                      # Next.js (App Router) Dashboard Web App
│       └── src/
│           ├── app/              # Next.js routes (/page.tsx, /verify)
│           └── components/
│               └── dashboard/    # SummaryStats, WalletList, PaymentTable, NotificationModal
├── contracts/
│   └── alert_registry/           # Soroban Rust Wasm Smart Contract
│       ├── Cargo.toml
│       └── src/lib.rs            # AlertRegistryContract Rust implementation
├── packages/
│   └── shared/                   # Monorepo shared package (@stellar-alerts/shared)
│       └── src/index.ts          # Shared DTO interfaces & StrKey validator
├── docs/
│   └── drips-wave-issues.json    # 42 Drips Wave issues backlog export
├── docker-compose.yml            # Local PostgreSQL 16 & Redis 7 stack
└── turbo.json                    # Turborepo task pipeline configuration
```

---

## 4. Active API Endpoints

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/health` | GET | No | Server health check |
| `/auth/request-link` | POST | No | Request a passwordless magic login link |
| `/auth/verify` | GET | No | Verify magic link token & issue session JWT |
| `/auth/me` | GET | Yes | Fetch authenticated user profile with wallets |
| `/wallets` | POST | Yes | Register a new Stellar public key (StrKey checksum guarded) |
| `/wallets` | GET | Yes | List registered wallets for current user |
| `/wallets/:id` | DELETE | Yes | Remove a wallet by ID |
| `/payments` | GET | Yes | Fetch payment transaction history |
| `/payments/summary`| GET | Yes | Aggregate payment stats (total payments, volume) |

---

## 5. Real-Time Ingestion Worker & Queue Flow

The ingestion worker ([watcher.worker.ts](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/api/src/workers/watcher.worker.ts)) operates as follows:

1. **Wallet Retrieval & Checksum Guard**: Fetches active wallets from PostgreSQL and verifies `StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)`.
2. **Horizon SSE Streaming**: Opens real-time Server-Sent Events stream (`server.payments().forAccount(key).cursor('now').stream()`).
3. **Soroban RPC Ingestion**: Queries `getEvents` for Soroban contract event logs.
4. **Idempotent Persistence**: Checks `prisma.payment.findUnique({ where: { txHash } })` to guarantee idempotent database insertion.
5. **BullMQ Queue Enqueueing**: Publishes alert payload to `payment-alerts` queue with exponential retry backoff (5 attempts).

---

## 6. Security & Compliance Architecture

- Only **public** Stellar addresses (`G...`) are stored. Private/secret keys are **never requested or stored**.
- All Ed25519 public keys are validated against Base32 CRC16-XMODEM checksums.
- Webhook dispatches include `X-Stellar-Alerts-Signature` headers signed via HMAC SHA256 with 5-minute clock drift tolerance.
- Fastify server enforces 30-second plugin connection timeouts (`pluginTimeout: 30000`).
