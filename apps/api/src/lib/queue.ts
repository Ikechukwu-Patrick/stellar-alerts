import { Queue, QueueEvents, Job, Worker } from 'bullmq';
import { Resend } from 'resend';
import { prisma } from './prisma';

export interface AlertJobData {
  paymentId: string;
  txHash: string;
  walletId: string;
  amount: string;
  asset: string;
  assetIssuer?: string | null;
  fromAddress: string;
  receivedAt: string;
}

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export let alertQueue: Queue<AlertJobData> | null = null;
export let dlqQueue: Queue<AlertJobData> | null = null;
export let alertQueueEvents: QueueEvents | null = null;
export let alertWorker: Worker<AlertJobData> | null = null;

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

try {
  const connection = {
    host: redisHost,
    port: redisPort,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  };

  alertQueue = new Queue<AlertJobData>('payment-alerts', {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

  dlqQueue = new Queue<AlertJobData>('payment-alerts-dlq', { connection });
  alertQueueEvents = new QueueEvents('payment-alerts', { connection });

  alertWorker = new Worker<AlertJobData>('payment-alerts', async (job) => {
    const data = job.data;
    
    const { data: resendData, error } = await resend.emails.send({
      from: 'Stellar Alerts <alerts@resend.dev>',
      to: [data.fromAddress],
      subject: `Payment Receipt: ${data.amount} ${data.asset}`,
      html: `
        <h1>Payment Receipt</h1>
        <p><strong>Payment ID:</strong> ${data.paymentId}</p>
        <p><strong>Transaction Hash:</strong> ${data.txHash}</p>
        <p><strong>Amount:</strong> ${data.amount} ${data.asset}</p>
        <p><strong>From Address:</strong> ${data.fromAddress}</p>
        <p><strong>Received At:</strong> ${data.receivedAt}</p>
      `,
    });

    if (error) {
      throw new Error(`Resend Error: ${error.message}`);
    }
    
    console.log(`[Worker] Sent email receipt for ${data.paymentId}`);

    try {
      const payment = await prisma.payment.findUnique({
        where: { id: data.paymentId },
        include: { wallet: { include: { user: { include: { notifyPrefs: true } } } } }
      });

      if (payment?.wallet?.user?.notifyPrefs?.telegramEnabled && payment.wallet.user.notifyPrefs.telegramChatId) {
        const chatId = payment.wallet.user.notifyPrefs.telegramChatId;
        const botToken = process.env.TELEGRAM_BOT_TOKEN || 'mock_token';
        const message = `Payment Receipt:\nAmount: ${data.amount} ${data.asset}\nFrom: ${data.fromAddress}`;
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message })
        });
        
        if (!response.ok) {
          console.warn(`[Worker] Failed to send Telegram message for ${data.paymentId}`);
        } else {
          console.log(`[Worker] Sent Telegram receipt for ${data.paymentId}`);
        }
      }
    } catch (dbErr: any) {
      console.warn(`[Worker] Failed to check Telegram preferences for ${data.paymentId}: ${dbErr.message}`);
    }

    return resendData;
  }, { connection });

  alertQueueEvents.on('failed', async ({ jobId, failedReason }) => {
    if (!jobId || !alertQueue || !dlqQueue) return;
    try {
      const job = await Job.fromId(alertQueue, jobId);
      if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
        await dlqQueue.add('dispatch-alert-failed', job.data, {
          jobId: `dlq-${jobId}`,
        });
        console.log(`[Queue] 📨 Moved failed job ${jobId} to DLQ. Reason: ${failedReason}`);
      }
    } catch (e: any) {
      console.warn(`[Queue] Could not route job ${jobId} to DLQ: ${e.message}`);
    }
  });

  console.log(`[Queue] 📡 BullMQ payment-alerts queue initialized (${redisHost}:${redisPort})`);
} catch (err: any) {
  console.warn(`[Queue] Could not initialize BullMQ queue: ${err.message}`);
}

export async function enqueuePaymentAlert(data: AlertJobData) {
  if (!alertQueue) {
    console.log(`[Queue] Skipping queue enqueue for payment ${data.txHash} (Queue not connected)`);
    return null;
  }

  try {
    const job = await alertQueue.add('dispatch-alert', data, {
      jobId: `payment-${data.txHash}`,
    });
    console.log(`[Queue] 📨 Enqueued payment alert job: ${job.id}`);
    return job;
  } catch (err: any) {
    console.warn(`[Queue] Failed to enqueue alert for payment ${data.txHash}: ${err.message}`);
    return null;
  }
}
