import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Job, QueueEvents, Worker } from 'bullmq';

// We mock bullmq before importing queue
vi.mock('bullmq', () => {
  const addMock = vi.fn().mockResolvedValue(true);
  const onMock = vi.fn();
  
  return {
    Queue: vi.fn().mockImplementation(() => {
      return {
        add: addMock,
      };
    }),
    QueueEvents: vi.fn().mockImplementation(() => {
      return {
        on: onMock,
      };
    }),
    Job: {
      fromId: vi.fn(),
    },
    Worker: vi.fn(),
  };
});

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => {
      return {
        emails: {
          send: vi.fn().mockResolvedValue({ data: { id: 'test_id' }, error: null }),
        },
      };
    }),
  };
});

vi.mock('./prisma', () => ({
  prisma: {
    payment: {
      findUnique: vi.fn(),
    },
  },
}));

import { alertQueue, dlqQueue, alertQueueEvents } from './queue';

const failedCall = (alertQueueEvents as any)?.on?.mock?.calls?.find((call: any[]) => call[0] === 'failed');
const failedHandler = failedCall ? failedCall[1] : null;

describe('Queue DLQ routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to DLQ when job fails after max attempts', async () => {
    expect(failedHandler).toBeDefined();

    (Job.fromId as any).mockResolvedValue({
      attemptsMade: 5,
      opts: { attempts: 5 },
      data: { txHash: 'test-tx' },
    });

    await failedHandler({ jobId: '123', failedReason: 'Test error' });

    expect(dlqQueue?.add).toHaveBeenCalledWith(
      'dispatch-alert-failed',
      { txHash: 'test-tx' },
      { jobId: 'dlq-123' }
    );
  });
  
  it('does not route to DLQ if attempts < max attempts', async () => {
    expect(failedHandler).toBeDefined();

    (Job.fromId as any).mockResolvedValue({
      attemptsMade: 3,
      opts: { attempts: 5 },
      data: { txHash: 'test-tx' },
    });

    await failedHandler({ jobId: '124', failedReason: 'Test error' });

    expect(dlqQueue?.add).not.toHaveBeenCalled();
  });
});

import { prisma } from './prisma';

const workerCall = (Worker as any).mock.calls.find((call: any[]) => call[0] === 'payment-alerts');
const workerHandler = workerCall ? workerCall[1] : null;

describe('Telegram Dispatcher Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  it('dispatches telegram message when user has valid chatId and enabled', async () => {
    expect(workerHandler).toBeDefined();

    (prisma.payment.findUnique as any).mockResolvedValue({
      id: 'pay-123',
      wallet: {
        user: {
          notifyPrefs: {
            telegramEnabled: true,
            telegramChatId: 'chat-123',
          },
        },
      },
    });

    await workerHandler({
      data: {
        paymentId: 'pay-123',
        amount: '10',
        asset: 'XLM',
        fromAddress: 'GABC...',
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.telegram.org/bot'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"chat_id":"chat-123"'),
      })
    );
  });

  it('does not dispatch telegram message when telegram is disabled', async () => {
    expect(workerHandler).toBeDefined();

    (prisma.payment.findUnique as any).mockResolvedValue({
      id: 'pay-124',
      wallet: {
        user: {
          notifyPrefs: {
            telegramEnabled: false,
            telegramChatId: 'chat-123',
          },
        },
      },
    });

    await workerHandler({
      data: {
        paymentId: 'pay-124',
      },
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
