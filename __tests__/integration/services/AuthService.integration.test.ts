import {
  UnauthorizedError,
  ValidationError,
} from '../../../src/errors/AppError';
import { CacheRepository } from '../../../src/repositories/CacheRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { AuthService } from '../../../src/services/AuthService';
import { UserService } from '../../../src/services/UserService';
import { TokenService } from '../../../src/services/TokenService';
import {
  closeTestConnections,
  resetCache,
  resetDatabase,
  testPool,
  testRedisClient,
} from '../../testSetup/testDb';

describe('AuthService (integration)', () => {
  const userRepository = new UserRepository(testPool);
  const cacheRepository = new CacheRepository(testRedisClient);
  const tokenService = new TokenService();
  const userService = new UserService(userRepository, cacheRepository);
  const authService = new AuthService(
    userRepository,
    cacheRepository,
    tokenService
  );

  beforeEach(async () => {
    await resetDatabase();
    await resetCache();
    await userService.createUser({
      username: 'integrationuser',
      name: 'Test User',
      password: 'password123',
      email: 'integration@example.com',
    });
  });

  afterAll(async () => {
    await closeTestConnections();
  });

  it('throws ValidationError when credentials are missing', async () => {
    await expect(
      authService.login({ username: 'integrationuser' })
    ).rejects.toThrow(ValidationError);
  });

  it('throws UnauthorizedError for a wrong password', async () => {
    await expect(
      authService.login({ username: 'integrationuser', password: 'wrong' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError for an unknown username', async () => {
    await expect(
      authService.login({ username: 'ghost', password: 'password123' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('logs in, returns a verifiable token, and caches the profile', async () => {
    const result = await authService.login({
      username: 'integrationuser',
      password: 'password123',
    });

    expect(tokenService.verify(result.token)).toEqual({
      subject: result.user.id,
    });

    const cached = await cacheRepository.getUserProfile(result.user.id);
    expect(cached).toEqual(result.user);
  });
});
