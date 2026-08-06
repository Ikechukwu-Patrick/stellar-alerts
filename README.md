# Stellar Alerts ⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.10-green.svg)](https://fastify.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)](https://nextjs.org/)
[![Stellar SDK](https://img.shields.io/badge/Stellar_SDK-13.3-purple.svg)](https://developers.stellar.org/)

**Real-Time Stellar Payment Tracker & Non-Custodial Alert Engine**

Stellar Alerts monitors registered Stellar public wallets in real time for incoming transactions on the Stellar network (Testnet / Mainnet). It records payment history in PostgreSQL and dispatches multi-channel alerts (Telegram, Email, Webhooks) without ever requesting or storing secret keys.

---

## 🌟 Key Features

- ⚡ **Zero-Delay Horizon Ingestion**: Listens directly to Stellar Horizon REST & SSE streams (`payment` and `create_account` operations).
- 🔒 **100% Non-Custodial**: Only public key addresses (`G...`) are stored. Secret keys are never touched or requested.
- 🪄 **1-Click Passwordless Auth**: Secure Magic Link email authentication (`/verify?token=...`) with zero password management overhead.
- 📊 **Multi-Wallet Ledger Dashboard**: Monitor business, freelance, and personal Stellar wallets in a single unified dashboard.
- 🛡️ **Idempotent Ingestion**: Deduplicates incoming transactions by `txHash` to guarantee clean financial ledgers.

---

## 🏗️ Architecture Overview

```
Stellar Network → Horizon Ingestion Worker → PostgreSQL → Fastify REST API → Next.js Web App
                        │
                        └──> Telegram / Email / Webhook Alerts
```

For complete technical specifications, database schemas, and data flow details, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## 🚀 Quick Start for Reviewers & Developers

### 1. Installation & Environment Setup
```bash
git clone https://github.com/stellar-alerts-labs/stellar-alerts.git
cd stellar-alerts
npm install
```

### 2. Database Push
```bash
npm run db:push
```

### 3. Launch Development Stack

Launch components individually in separate terminal sessions:

```bash
npm run dev:api     # Fastify REST API on http://localhost:3001
npm run dev:worker  # Stellar Horizon Ingestion Worker
npm run dev:web     # Next.js Dashboard on http://localhost:3000
```

### 4. Test Live Stellar Payment Ingestion
Fund a fresh keypair on Stellar Testnet via Friendbot and verify automated ingestion into PostgreSQL:
```bash
npx tsx --env-file=apps/api/.env apps/api/scripts/seed-and-trigger-payment.ts
```

---

## 🏆 Grant Qualification & Documentation

- **Grant Submission Matrix**: See **[SUBMISSION.md](SUBMISSION.md)** for full project qualification requirements.
- **System Design & API Specs**: See **[ARCHITECTURE.md](ARCHITECTURE.md)**.
- **Contribution Guidelines**: See **[CONTRIBUTING.md](CONTRIBUTING.md)**.
- **Development Roadmap**: See **[ROADMAP.md](ROADMAP.md)**.

---

## 📄 License

Released under the [MIT License](LICENSE).
