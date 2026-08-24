import { Queue, QueueEvents, Job } from 'bullmq';

export interface AlertJobData {
  paymentId: string;
  txHash: string;
  walletId: string;
  amount: string;
  asset: string;
  fromAddress: string;
  receivedAt: string;
}

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export let alertQueue: Queue<AlertJobData> | null = null;
export let dlqQueue: Queue<AlertJobData> | null = null;
export let alertQueueEvents: QueueEvents | null = null;

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
