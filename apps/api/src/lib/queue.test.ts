import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Job } from 'bullmq';

const { queueState } = vi.hoisted(() => ({
  queueState: { failedHandler: null as any },
}));

// We mock bullmq before importing queue
vi.mock('bullmq', () => {
  const addMock = vi.fn().mockResolvedValue(true);
  
  return {
    Queue: vi.fn().mockImplementation(() => {
      return {
        add: addMock,
      };
    }),
    QueueEvents: vi.fn().mockImplementation(() => {
      return {
        on: vi.fn((event: string, handler: any) => {
          if (event === 'failed') {
            queueState.failedHandler = handler;
          }
        }),
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

import { dlqQueue } from './queue';

describe('Queue DLQ routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to DLQ when job fails after max attempts', async () => {
    expect(queueState.failedHandler).toBeDefined();

    (Job.fromId as any).mockResolvedValue({
      attemptsMade: 5,
      opts: { attempts: 5 },
      data: { txHash: 'test-tx' },
    });

    await queueState.failedHandler({ jobId: '123', failedReason: 'Test error' });

    expect(dlqQueue?.add).toHaveBeenCalledWith(
      'dispatch-alert-failed',
      { txHash: 'test-tx' },
      { jobId: 'dlq-123' }
    );
  });
  
  it('does not route to DLQ if attempts < max attempts', async () => {
    expect(queueState.failedHandler).toBeDefined();

    (Job.fromId as any).mockResolvedValue({
      attemptsMade: 3,
      opts: { attempts: 5 },
      data: { txHash: 'test-tx' },
    });

    await queueState.failedHandler({ jobId: '124', failedReason: 'Test error' });

    expect(dlqQueue?.add).not.toHaveBeenCalled();
  });
});
