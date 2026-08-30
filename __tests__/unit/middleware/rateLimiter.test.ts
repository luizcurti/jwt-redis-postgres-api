import express, { Express } from 'express';
import request from 'supertest';
import { createLoginRateLimiter } from '../../../src/middleware/rateLimiter';

function buildApp(overrides: Parameters<typeof createLoginRateLimiter>[0]) {
  const app: Express = express();
  app.post('/login', createLoginRateLimiter(overrides), (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe('createLoginRateLimiter', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp({ windowMs: 1000, max: 2, skip: () => false });

    await request(app).post('/login').expect(200);
    await request(app).post('/login').expect(200);
  });

  it('blocks requests over the limit with 429', async () => {
    const app = buildApp({ windowMs: 1000, max: 2, skip: () => false });

    await request(app).post('/login').expect(200);
    await request(app).post('/login').expect(200);
    const res = await request(app).post('/login');

    expect(res.statusCode).toBe(429);
    expect(res.body).toEqual({
      error: 'Too many login attempts. Please try again later.',
    });
  });

  it('is skipped by default when NODE_ENV is test', async () => {
    const app = buildApp({ windowMs: 1000, max: 1 });

    await request(app).post('/login').expect(200);
    await request(app).post('/login').expect(200);
    await request(app).post('/login').expect(200);
  });
});
