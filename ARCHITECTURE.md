# Stellar Payment Tracker — Architecture

## 1. Overview

Stellar Alerts is an open-source real-time tracker and alert system for Stellar wallets. It monitors registered Stellar public keys for incoming payment operations on the Stellar network (Testnet / Mainnet) and records full transaction history in PostgreSQL, with real-time notifications dispatched to users.

Data flows in one direction, start to finish:

```
Stellar network → Ingestion Worker (Watcher) → PostgreSQL → Fastify API → Next.js Web App
                         │
                         └──> Telegram / Email / Webhooks (Notifications)
```

The Next.js web application never communicates with Stellar directly. It consumes the typed Fastify REST API, which queries PostgreSQL via Prisma ORM.

---

## 2. Tech Stack

| Layer            | Choice                                   | Status |
|-------------------|-------------------------------------------|--------|
| Backend framework | Fastify + TypeScript                      | ✅ Implemented |
| Frontend framework| Next.js (App Router) + TypeScript         | 🔄 Next Phase |
| Database & ORM    | PostgreSQL + Prisma ORM                   | ✅ Implemented |
| Blockchain SDK    | `stellar-sdk` (Horizon REST + Testnet)    | ✅ Implemented |
| Ingestion Worker  | Standalone Node/TypeScript process (`watcher.worker.ts`) | ✅ Implemented |
| Job queue         | BullMQ + Redis                            | 🔄 Planned |
| Notifications     | Telegram Bot API, Email (Resend), Webhooks | 🔄 Planned |
| Auth              | Passwordless Magic Link + JWT Session      | ✅ Implemented |

---

## 3. Backend Architecture (`apps/api`)

```
apps/api/
├── src/
│   ├── server.ts                 # Entry point, starts Fastify HTTP server
│   ├── app.ts                    # Registers plugins, middleware, and routes
│   ├── config/
│   │   └── env.ts                # Environment variable validation (Zod)
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client singleton
│   │   └── stellar.ts            # Stellar Horizon SDK wrapper & validation
│   ├── plugins/
│   │   └── prisma.ts             # Fastify Prisma plugin
│   ├── middleware/
│   │   └── auth.middleware.ts    # JWT Bearer token authentication preHandler
│   ├── utils/
│   │   └── jwt.ts                # Magic token and Session token generation & verification
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts     # POST /auth/request-link, GET /auth/verify, GET /auth/me
│   │   │   ├── auth.controller.ts # Request handlers & error response formatting
│   │   │   ├── auth.service.ts    # Magic link signing, verification, and user upsert
│   │   │   └── auth.schema.ts     # Zod validation schemas
│   │   ├── wallets/
│   │   │   ├── wallets.routes.ts  # POST /wallets, GET /wallets, DELETE /wallets/:id
│   │   │   ├── wallets.controller.ts
│   │   │   ├── wallets.service.ts # Public key validation & DB persistence
│   │   │   └── wallets.schema.ts
│   │   └── payments/
│   │       ├── payments.routes.ts # GET /payments, GET /payments/summary
│   │       ├── payments.controller.ts
│   │       └── payments.service.ts# Payment queries & summary statistics
│   └── workers/
│       └── watcher.worker.ts     # Stellar Horizon worker process for payment ingestion
├── prisma/
│   └── schema.prisma             # Data models for User, Wallet, Payment, NotificationPreference
└── package.json
```

---

## 4. Active API Endpoints

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/health` | GET | No | Server health check |
| `/auth/request-link` | POST | No | Request a passwordless magic login link |
| `/auth/verify` | GET | No | Verify magic link token & issue session JWT |
| `/auth/me` | GET | Yes | Fetch authenticated user profile with wallets |
| `/wallets` | POST | Yes | Register a new Stellar public key |
| `/wallets` | GET | Yes | List registered wallets for current user |
| `/wallets/:id` | DELETE | Yes | Remove a wallet by ID |
| `/payments` | GET | Yes | Fetch payment transaction history |
| `/payments/summary`| GET | Yes | Aggregate payment stats (total payments, volume) |

---

## 5. Ingestion Worker Flow

The ingestion worker ([watcher.worker.ts](file:///c:/Users/user/OneDrive/Documents/Open-source/stellar-alerts/apps/api/src/workers/watcher.worker.ts)) operates as follows:

1. **Wallet Retrieval**: Fetches all active tracked wallets from PostgreSQL.
2. **Horizon Ingestion**: Queries `stellar-sdk` Horizon API for recent payment operations (`payment` and `create_account`).
3. **Validation & Deduplication**:
   - Validates Stellar public key format (`G...`, 56 characters).
   - Checks `prisma.payment.findUnique({ where: { txHash } })` to guarantee idempotent ingestion without duplicate records.
4. **Persistence**: Writes payment records (amount, asset, fromAddress, receivedAt, txHash) to the `Payment` table.

Run the worker locally:
```bash
npm run dev:worker
```

---

## 6. Database Schema (Prisma)

```prisma
model User {
  id          String                   @id @default(cuid())
  email       String                   @unique
  createdAt   DateTime                 @default(now())
  wallets     Wallet[]
  notifyPrefs NotificationPreference?
}

model Wallet {
  id         String     @id @default(cuid())
  userId     String
  user       User       @relation(fields: [userId], references: [id])
  publicKey  String     @unique
  label      String?
  createdAt  DateTime   @default(now())
  payments   Payment[]
}

model Payment {
  id          String   @id @default(cuid())
  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])
  txHash      String   @unique
  fromAddress String
  amount      Decimal
  asset       String
  memo        String?
  receivedAt  DateTime
  createdAt   DateTime @default(now())
}

model NotificationPreference {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id])
  telegramChatId  String?
  telegramEnabled Boolean @default(false)
  emailEnabled    Boolean @default(true)
  whatsappNumber  String?
  whatsappEnabled Boolean @default(false)
}
```

---

## 7. Security Notes

- Only **public** Stellar addresses (`G...`) are stored. Private keys are never requested or stored.
- All endpoints validate inputs using Zod schemas.
- JWT Session tokens are signed using a secret environment key with strict expiration windows.
