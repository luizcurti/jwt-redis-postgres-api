import { CacheRepository } from '../../../src/repositories/CacheRepository';
import {
  closeTestConnections,
  resetCache,
  testRedisClient,
} from '../../testSetup/testDb';

describe('CacheRepository (integration)', () => {
  const repository = new CacheRepository(testRedisClient);

  beforeEach(async () => {
    await resetCache();
  });

  afterAll(async () => {
    await closeTestConnections();
  });

  it('returns null for a profile that was never cached', async () => {
    await expect(repository.getUserProfile('missing-user')).resolves.toBeNull();
  });

  it('round-trips a profile through Redis', async () => {
    const profile = {
      id: 'user-1',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
    };

    await repository.setUserProfile('user-1', profile);

    await expect(repository.getUserProfile('user-1')).resolves.toEqual(profile);
  });

  it('applies the TTL passed to setUserProfile', async () => {
    const profile = {
      id: 'user-1',
      name: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
    };

    await repository.setUserProfile('user-1', profile, 120);

    const ttl = await testRedisClient.ttl('user-user-1');

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(120);
  });
});
