import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- TESTING POSTGRES DECIMALS ---');
  
  // 1. Create a dummy user
  const user = await prisma.user.create({
    data: { email: `test-${Date.now()}@example.com` }
  });
  console.log(`Created user: ${user.id}`);

  // 2. Create a wallet
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      publicKey: `G-${Date.now()}-PUBKEY`,
      label: 'Postgres Test Wallet'
    }
  });
  console.log(`Created wallet: ${wallet.id}`);

  // 3. Create a payment with a Decimal amount
  // We want to test large/small decimals (e.g. 1.2345678)
  const amountStr = "123456.7891234";
  const payment = await prisma.payment.create({
    data: {
      walletId: wallet.id,
      txHash: `tx-${Date.now()}`,
      fromAddress: 'G-SOME-SENDER',
      amount: amountStr,
      asset: 'XLM',
      receivedAt: new Date()
    }
  });
  console.log(`Created payment: ${payment.id}, amount sent: ${amountStr}`);

  // 4. Read back the payment
  const readPayment = await prisma.payment.findUniqueOrThrow({
    where: { id: payment.id }
  });

  console.log(`Read back amount: ${readPayment.amount.toString()}`);
  if (readPayment.amount.toString() === amountStr) {
    console.log('SUCCESS: Decimal amount read back correctly.');
  } else {
    console.error('ERROR: Decimal amounts do not match!');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
