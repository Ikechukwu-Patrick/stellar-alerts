import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, UserPayload } from '../utils/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
  }
}

export async function authenticateHook(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'You must be logged in to perform this action.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken<UserPayload>(token);
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired session token.',
      code: 'INVALID_TOKEN',
    });
  }
}
