# Project Roadmap & Drips Wave Status

This document outlines the implementation status and roadmap for Stellar Alerts.

---

### Phase 1: Foundation & Monorepo Architecture
- [x] Initialize Git repository, `.gitignore`, and MIT License
- [x] Create project `README.md`, `ARCHITECTURE.md`, and `CONTRIBUTING.md`
- [x] Scaffold monorepo workspace (`apps/api`, `apps/web`, `packages/shared`)
- [x] Add `@stellar-alerts/shared` workspace package for shared DTOs & StrKey validators
- [x] Configure Turborepo task pipeline (`turbo.json`)
- [x] Add GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`)
- [x] Add automated Vitest unit testing suite (`npm run test:api`)
- [x] Add GitHub Issue Templates & Pull Request Template (`.github/ISSUE_TEMPLATE/`)
- [x] Add Code of Conduct (`CODE_OF_CONDUCT.md`) and Security Policy (`SECURITY.md`)
- [x] Add local Docker Compose stack for PostgreSQL 16 & Redis 7 (`docker-compose.yml`)

---

### Phase 2: Backend API & Blockchain Ingestion Engine
- [x] Fastify API server with health check (`GET /health`)
- [x] Prisma schema design for User, Wallet, Payment, NotificationPreference
- [x] Passwordless magic-link authentication (`/auth/request-link`, `/auth/verify`)
- [x] StrKey Base32 CRC16-XMODEM public key checksum validation
- [x] Real-time Horizon Server-Sent Events (SSE) stream watcher (`watcher.worker.ts`)
- [x] BullMQ + Redis job queue for payment alert dispatches (`apps/api/src/lib/queue.ts`)
- [x] HMAC SHA256 cryptographic webhook signature generator (`webhook-signer.ts`)
- [x] Payments history and aggregate summary REST endpoints (`/payments`, `/payments/summary`)

---

### Phase 3: Soroban Smart Contract & RPC Integration
- [x] On-chain Soroban Rust Wasm Smart Contract (`contracts/alert_registry/src/lib.rs`)
- [x] Soroban RPC event parser and contract event client (`apps/api/src/lib/soroban.ts`)
- [x] Soroban Wasm compilation and deployment guide (`contracts/alert_registry/README.md`)

---

### Phase 4: Frontend Web Dashboard (Next.js)
- [x] Scaffold Next.js App Router application with Tailwind CSS
- [x] Build landing page and magic link login flow
- [x] Modular React component structure (`SummaryStats`, `WalletList`, `PaymentTable`, `NotificationModal`)
- [x] Multi-wallet ledger dashboard with live Stellar Expert explorer links
- [x] Verified production build (`npm run build --workspace=web`)

---

### Phase 5: Production & Community Scaling (Future Backlog)
- [ ] Implement play-to-earn & Soroban SAC token reward incentives
- [ ] Playwright E2E browser automation test suite
- [ ] Push Notification Service Worker & PWA Manifest
- [ ] Dependabot dependency vulnerability tracking
- [ ] Automated semantic versioning and release notes via Changesets
