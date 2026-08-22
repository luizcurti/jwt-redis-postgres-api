import { Redis } from 'ioredis';
import { CacheRepository } from '../../../src/repositories/CacheRepository';

describe('CacheRepository', () => {
  let redisClient: { get: jest.Mock; set: jest.Mock };
  let repository: CacheRepository;

  beforeEach(() => {
    redisClient = { get: jest.fn(), set: jest.fn() };
    repository = new CacheRepository(redisClient as unknown as Redis);
  });

  describe('getUserProfile', () => {
    it('returns the parsed profile when cached', async () => {
      const profile = {
        id: '1',
        name: 'Test',
        username: 'testuser',
        email: 'test@example.com',
      };
      redisClient.get.mockResolvedValueOnce(JSON.stringify(profile));

      const result = await repository.getUserProfile('1');

      expect(redisClient.get).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(profile);
    });

    it('returns null on a cache miss', async () => {
      redisClient.get.mockResolvedValueOnce(null);

      const result = await repository.getUserProfile('1');

      expect(result).toBeNull();
    });
  });

  describe('setUserProfile', () => {
    it('stores the profile with the default TTL', async () => {
      const profile = {
        id: '1',
        name: 'Test',
        username: 'testuser',
        email: 'test@example.com',
      };

      await repository.setUserProfile('1', profile);

      expect(redisClient.set).toHaveBeenCalledWith(
        'user-1',
        JSON.stringify(profile),
        'EX',
        3600
      );
    });

    it('stores the profile with a custom TTL', async () => {
      const profile = {
        id: '1',
        name: 'Test',
        username: 'testuser',
        email: 'test@example.com',
      };

      await repository.setUserProfile('1', profile, 60);

      expect(redisClient.set).toHaveBeenCalledWith(
        'user-1',
        JSON.stringify(profile),
        'EX',
        60
      );
    });
  });
});
