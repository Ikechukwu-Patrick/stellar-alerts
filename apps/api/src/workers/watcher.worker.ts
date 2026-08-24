import * as StellarSdk from 'stellar-sdk';
import { prisma } from '../lib/prisma';
import { stellar } from '../lib/stellar';
import { enqueuePaymentAlert } from '../lib/queue';
import { getSorobanLatestLedger } from '../lib/soroban';

export async function processPaymentRecord(
  wallet: { id: string; publicKey: string },
  record: any
) {
  let amount: string | undefined;
  let asset: string = 'XLM';
  let fromAddress: string = '';
  const txHash: string = record.transaction_hash;
  const receivedAt: Date = new Date(record.created_at || Date.now());

  if (record.type === 'payment') {
    amount = record.amount;
    asset = record.asset_type === 'native' ? 'XLM' : record.asset_code || 'Unknown';
    fromAddress = record.from || '';
  } else if (record.type === 'create_account') {
    amount = record.starting_balance;
    asset = 'XLM';
    fromAddress = record.funder || '';
  }

  if (!amount || !txHash) return;

  // Deduplicate check
  const existing = await prisma.payment.findUnique({ where: { txHash } });
  if (!existing) {
    console.log(
      `[WatcherWorker] 💰 New ${record.type} detected for wallet (${wallet.publicKey.substring(
        0,
        8
      )}...): ${amount} ${asset}`
    );

    const payment = await prisma.payment.create({
      data: {
        walletId: wallet.id,
        txHash,
        fromAddress,
        amount: Number(amount),
        asset,
        receivedAt,
      },
    });

    // Enqueue off-chain alert dispatch job to BullMQ queue
    await enqueuePaymentAlert({
      paymentId: payment.id,
      txHash,
      walletId: wallet.id,
      amount,
      asset,
      fromAddress,
      receivedAt: receivedAt.toISOString(),
    });
  }
}

// Number of operations pulled from Horizon per cursor page
const CURSOR_PAGE_SIZE = 50;

// Upper bound on pages walked in a single catch-up pass, so a long outage
// cannot stall the poll loop indefinitely
const MAX_CATCHUP_PAGES = 20;

export async function saveCursor(walletId: string, pagingToken: string) {
  await prisma.ingestionCursor.upsert({
    where: { walletId },
    create: { walletId, pagingToken },
    update: { pagingToken },
  });
}

/**
 * Returns the persisted paging token for a wallet, creating the cursor record
 * on first sight. A fresh cursor is seeded from the wallet's latest Horizon
 * paging token so that registering a wallet does not replay its whole history.
 */
export async function ensureCursor(wallet: { id: string; publicKey: string }): Promise<string> {
  const existing = await prisma.ingestionCursor.findUnique({ where: { walletId: wallet.id } });
  if (existing) return existing.pagingToken;

  const pagingToken = await stellar.getLatestPagingToken(wallet.publicKey);
  const created = await prisma.ingestionCursor.create({
    data: { walletId: wallet.id, pagingToken },
  });
  console.log(
    `[WatcherWorker] 🔖 Seeded ingestion cursor for wallet ${wallet.publicKey.substring(0, 8)}... at ${pagingToken}`
  );
  return created.pagingToken;
}

export async function processWalletPayments(wallet: { id: string; publicKey: string }) {
  if (!wallet.publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(wallet.publicKey)) {
    console.warn(`[WatcherWorker] Skipping invalid public key checksum: "${wallet.publicKey}"`);
    return;
  }

  let cursor = await ensureCursor(wallet);

  for (let page = 0; page < MAX_CATCHUP_PAGES; page++) {
    const records = (await stellar.getPaymentsSince(
      wallet.publicKey,
      cursor,
      CURSOR_PAGE_SIZE
    )) as any[];
    if (records.length === 0) return;

    for (const record of records) {
      await processPaymentRecord(wallet, record);
      if (record.paging_token) {
        cursor = record.paging_token;
        await saveCursor(wallet.id, cursor);
      }
    }

    if (records.length < CURSOR_PAGE_SIZE) return;
  }

  console.warn(
    `[WatcherWorker] Catch-up page limit reached for ${wallet.publicKey.substring(0, 8)}..., resuming next poll from ${cursor}`
  );
}

export async function startHorizonSSEStream(wallet: { id: string; publicKey: string }) {
  console.log(`[WatcherWorker] 📡 Opening Horizon SSE payment stream for wallet ${wallet.publicKey.substring(0, 8)}...`);

  try {
    const cursor = await ensureCursor(wallet);

    const closeStream = stellar.server
      .payments()
      .forAccount(wallet.publicKey)
      .cursor(cursor)
      .stream({
        onmessage: async (record: any) => {
          console.log(`[WatcherStream] ⚡ Live SSE stream message received: ${record.type}`);
          await processPaymentRecord(wallet, record);
          if (record.paging_token) {
            await saveCursor(wallet.id, record.paging_token);
          }
        },
        onerror: (error: any) => {
          console.error(`[WatcherStream] SSE stream error for ${wallet.publicKey.substring(0, 8)}...:`, error);
        },
      });

    return closeStream;
  } catch (err: any) {
    console.error(`[WatcherStream] Failed to open SSE stream: ${err.message}`);
    return null;
  }
}

export async function runWatcher() {
  console.log('[WatcherWorker] 🚀 Starting Stellar Testnet Watcher Worker...');

  const poll = async () => {
    try {
      const wallets = await prisma.wallet.findMany();
      if (wallets.length === 0) {
        console.log('[WatcherWorker] No wallets registered in DB to watch. Waiting for next poll...');
        return;
      }

      console.log(`[WatcherWorker] Checking ${wallets.length} registered wallet(s)...`);
      for (const wallet of wallets) {
        await processWalletPayments(wallet);
      }
    } catch (error) {
      console.error('[WatcherWorker] Polling error:', error);
    }
  };

  // Initial payment catchup run
  await poll();

  // Schedule periodic catchup poll every 30 seconds
  setInterval(poll, 30000);
}

if (require.main === module) {
  runWatcher();
}
