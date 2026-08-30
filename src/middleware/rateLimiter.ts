import { RequestHandler } from 'express';
import rateLimit, { Options } from 'express-rate-limit';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 10;

export function createLoginRateLimiter(
  overrides: Partial<Options> = {}
): RequestHandler {
  return rateLimit({
    windowMs: DEFAULT_WINDOW_MS,
    max: DEFAULT_MAX_ATTEMPTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (_request, response) => {
      response
        .status(429)
        .json({ error: 'Too many login attempts. Please try again later.' });
    },
    ...overrides,
  });
}
