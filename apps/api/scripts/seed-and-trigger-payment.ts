import { prisma } from '../src/lib/prisma';
import * as StellarSdk from 'stellar-sdk';
import { processWalletPayments } from '../src/workers/watcher.worker';

async function main() {
  console.log('--- Step 1: Ensure User exists in DB ---');
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test-worker@stellar-alerts.com',
      },
    });
    console.log('Created test user:', user.email);
  } else {
    console.log('Found existing user:', user.email);
  }

  console.log('\n--- Step 2: Generate Stellar Testnet Keypair ---');
  const pair = StellarSdk.Keypair.random();
  const publicKey = pair.publicKey();
  console.log('Public Key:', publicKey);

  console.log('\n--- Step 3: Fund Wallet via Stellar Friendbot ---');
  const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
  const friendbotResult = await response.json();
  console.log('Friendbot funding status:', response.ok ? 'SUCCESS (10,000 XLM funded)' : 'Failed');
  if (friendbotResult.hash) {
    console.log('Transaction Hash:', friendbotResult.hash);
  }

  console.log('\n--- Step 4: Register Wallet in DB ---');
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      publicKey: publicKey,
      label: 'Testnet Worker Wallet',
    },
  });
  console.log('Wallet saved to DB with ID:', wallet.id);

  console.log('\n--- Step 5: Run Worker Ingestion Logic ---');
  await processWalletPayments(wallet);

  console.log('\n--- Step 6: Verify Recorded Payments in Database ---');
  const payments = await prisma.payment.findMany({
    where: { walletId: wallet.id },
  });

  console.log(`Found ${payments.length} payment record(s) in DB:`);
  console.log(JSON.stringify(payments, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error in seed-and-trigger-payment:', err);
  process.exit(1);
});
