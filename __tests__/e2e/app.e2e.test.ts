import request from 'supertest';
import app from '../../src/server';
import {
  closeTestConnections,
  resetCache,
  resetDatabase,
} from '../testSetup/testDb';

async function createAndLoginUser(username: string) {
  await request(app)
    .post('/users')
    .send({
      username,
      name: 'Test User',
      password: 'password123',
      email: `${username}@example.com`,
    });

  const loginRes = await request(app)
    .post('/login')
    .send({ username, password: 'password123' });

  return {
    token: loginRes.body.token as string,
    id: loginRes.body.user.id as string,
  };
}

describe('App (e2e)', () => {
  beforeEach(async () => {
    await resetDatabase();
    await resetCache();
  });

  afterAll(async () => {
    await closeTestConnections();
  });

  describe('GET /', () => {
    it('reports the server is running', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: 'Server is running!' });
    });
  });

  describe('POST /users', () => {
    it('creates a new user', async () => {
      const res = await request(app).post('/users').send({
        username: 'newuser',
        name: 'New User',
        password: 'password123',
        email: 'newuser@example.com',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'User created successfully');
      expect(res.body).toHaveProperty('userId');
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/users')
        .send({ username: 'newuser' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: 'Missing required fields.' });
    });

    it('returns 409 when the username already exists', async () => {
      await createAndLoginUser('duplicateuser');

      const res = await request(app).post('/users').send({
        username: 'duplicateuser',
        name: 'Another User',
        password: 'password123',
        email: 'another@example.com',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toEqual({ error: 'Username already taken.' });
    });
  });

  describe('POST /login', () => {
    it('logs in with valid credentials', async () => {
      await createAndLoginUser('loginuser');

      const res = await request(app)
        .post('/login')
        .send({ username: 'loginuser', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        username: 'loginuser',
        email: 'loginuser@example.com',
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 400 when username or password is missing', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'loginuser' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        error: 'Username and password are required.',
      });
    });

    it('returns 401 for an unknown username', async () => {
      const res = await request(app)
        .post('/login')
        .send({ username: 'ghost', password: 'password123' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid credentials.' });
    });

    it('returns 401 for a wrong password', async () => {
      await createAndLoginUser('loginuser');

      const res = await request(app)
        .post('/login')
        .send({ username: 'loginuser', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid credentials.' });
    });
  });

  describe('GET /users/profile/:id', () => {
    it('returns the profile for the authenticated owner', async () => {
      const { token, id } = await createAndLoginUser('profileuser');

      const res = await request(app)
        .get(`/users/profile/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ id, username: 'profileuser' });
    });

    it('returns 401 when the Authorization header is missing', async () => {
      const res = await request(app).get('/users/profile/some-id');

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Token missing' });
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(app)
        .get('/users/profile/some-id')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid token' });
    });

    it('returns 403 when a user requests another user profile (IDOR protection)', async () => {
      const userA = await createAndLoginUser('usera');
      const userB = await createAndLoginUser('userb');

      const res = await request(app)
        .get(`/users/profile/${userB.id}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({
        error: 'You are not allowed to access this profile.',
      });
    });

    it('returns 404 when the profile is not cached', async () => {
      const { token, id } = await createAndLoginUser('profileuser');
      await resetCache();

      const res = await request(app)
        .get(`/users/profile/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'User not found in cache.' });
    });
  });
});
