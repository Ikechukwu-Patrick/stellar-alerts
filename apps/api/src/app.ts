import Fastify from 'fastify';
import cors from '@fastify/cors';
import prismaPlugin from './plugins/prisma';
import { authRoutes } from './modules/auth/auth.routes';
import { walletsRoutes } from './modules/wallets/wallets.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
    pluginTimeout: 30000,
  });

  await app.register(cors, {
    origin: true // Allow all origins for dev, or specify 'http://localhost:3000'
  });

  await app.register(prismaPlugin);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  app.register(authRoutes);
  app.register(walletsRoutes);
  app.register(paymentsRoutes);

  return app;
};
