# ⚡ Stellar Alerts — Soroban On-Chain Alert Registry Contract

This directory contains the **Soroban Wasm Smart Contract** for Stellar Alerts.

It enables decentralized applications (dApps) and individual Stellar accounts to programmatically register payment alert listeners directly on the Stellar blockchain.

---

## 🏗️ Smart Contract API Specification

### 1. `register_listener(user: Address, channel: Symbol, target: String)`
Registers an alert listener preference for `user` on channel (e.g. `symbol_short!("telegram")`, `symbol_short!("email")`, or `symbol_short!("webhook")`).
Requires authentication from `user`. Publishes a `REGISTERED` event on-chain for off-chain ingestion watchers.

### 2. `get_listener(user: Address, channel: Symbol) -> Option<String>`
Queries stored target string (e.g. Telegram Chat ID, Email Address, or Webhook URL) for a given account.

---

## 🛠️ How to Compile & Deploy Locally

### Prerequisites
- **Rust Toolchain**: [rustup.rs](https://rustup.rs) with WASM target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- **Soroban CLI**:
  ```bash
  cargo install --locked soroban-cli
  ```

### Build WASM Binary
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Deploy to Stellar Testnet
```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/stellar_alerts_registry.wasm \
  --source <YOUR_STELLAR_TESTNET_SECRET_KEY> \
  --network testnet
```
