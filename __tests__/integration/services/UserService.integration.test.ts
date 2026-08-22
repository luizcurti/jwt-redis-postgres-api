import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../src/errors/AppError';
import { CacheRepository } from '../../../src/repositories/CacheRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { UserService } from '../../../src/services/UserService';
import {
  closeTestConnections,
  resetCache,
  resetDatabase,
  testPool,
  testRedisClient,
} from '../../testSetup/testDb';

describe('UserService (integration)', () => {
  const userRepository = new UserRepository(testPool);
  const cacheRepository = new CacheRepository(testRedisClient);
  const service = new UserService(userRepository, cacheRepository);

  beforeEach(async () => {
    await resetDatabase();
    await resetCache();
  });

  afterAll(async () => {
    await closeTestConnections();
  });

  it('creates a user that is then findable in Postgres', async () => {
    const { id } = await service.createUser({
      username: 'integrationuser',
      name: 'Test User',
      password: 'password123',
      email: 'integration@example.com',
    });

    const stored = await userRepository.findByUsername('integrationuser');

    expect(stored?.id).toBe(id);
    expect(stored?.password).not.toBe('password123');
  });

  it('rejects creating a user with a username that already exists', async () => {
    const input = {
      username: 'integrationuser',
      name: 'Test User',
      password: 'password123',
      email: 'integration@example.com',
    };

    await service.createUser(input);

    await expect(
      service.createUser({ ...input, email: 'other@example.com' })
    ).rejects.toThrow(ConflictError);
  });

  it('throws ForbiddenError when fetching another user profile', async () => {
    await expect(service.getUserProfile('user-a', 'user-b')).rejects.toThrow(
      ForbiddenError
    );
  });

  it('throws NotFoundError when the profile is not cached', async () => {
    await expect(service.getUserProfile('user-a', 'user-a')).rejects.toThrow(
      NotFoundError
    );
  });

  it('returns the cached profile for the owning user', async () => {
    const profile = {
      id: 'user-a',
      name: 'Test User',
      username: 'integrationuser',
      email: 'integration@example.com',
    };
    await cacheRepository.setUserProfile('user-a', profile);

    await expect(service.getUserProfile('user-a', 'user-a')).resolves.toEqual(
      profile
    );
  });
});
