import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../src/errors/AppError';
import { CacheRepository } from '../../../src/repositories/CacheRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { UserService } from '../../../src/services/UserService';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UserService', () => {
  let userRepository: jest.Mocked<
    Pick<
      UserRepository,
      'existsByUsername' | 'existsByEmail' | 'create' | 'findByUsername'
    >
  >;
  let cacheRepository: jest.Mocked<
    Pick<CacheRepository, 'getUserProfile' | 'setUserProfile'>
  >;
  let service: UserService;

  beforeEach(() => {
    userRepository = {
      existsByUsername: jest.fn(),
      existsByEmail: jest.fn(),
      create: jest.fn(),
      findByUsername: jest.fn(),
    };
    cacheRepository = {
      getUserProfile: jest.fn(),
      setUserProfile: jest.fn(),
    };
    service = new UserService(
      userRepository as unknown as UserRepository,
      cacheRepository as unknown as CacheRepository
    );
  });

  describe('createUser', () => {
    const validInput = {
      username: 'newuser',
      name: 'Test User',
      password: 'password123',
      email: 'newuser@example.com',
    };

    it('throws ValidationError when a required field is missing', async () => {
      await expect(service.createUser({ username: 'newuser' })).rejects.toThrow(
        ValidationError
      );
      expect(userRepository.existsByUsername).not.toHaveBeenCalled();
    });

    it('throws ConflictError when the username is already taken', async () => {
      userRepository.existsByUsername.mockResolvedValueOnce(true);

      await expect(service.createUser(validInput)).rejects.toThrow(
        ConflictError
      );
      expect(userRepository.existsByEmail).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictError when the email is already registered', async () => {
      userRepository.existsByUsername.mockResolvedValueOnce(false);
      userRepository.existsByEmail.mockResolvedValueOnce(true);

      await expect(service.createUser(validInput)).rejects.toThrow(
        ConflictError
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('creates the user and returns the generated id', async () => {
      userRepository.existsByUsername.mockResolvedValueOnce(false);
      userRepository.existsByEmail.mockResolvedValueOnce(false);

      const result = await service.createUser(validInput);

      expect(result.id).toEqual(expect.any(String));
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: result.id,
          name: validInput.name,
          username: validInput.username,
          passwordHash: 'hashed-password',
          email: validInput.email,
        })
      );
    });
  });

  describe('getUserProfile', () => {
    it('throws ForbiddenError when the requesting user is not the target user', async () => {
      await expect(service.getUserProfile('user-a', 'user-b')).rejects.toThrow(
        ForbiddenError
      );
      expect(cacheRepository.getUserProfile).not.toHaveBeenCalled();
    });

    it('throws NotFoundError on a cache miss', async () => {
      cacheRepository.getUserProfile.mockResolvedValueOnce(null);

      await expect(service.getUserProfile('user-a', 'user-a')).rejects.toThrow(
        NotFoundError
      );
    });

    it('returns the cached profile when the requester owns it', async () => {
      const profile = {
        id: 'user-a',
        name: 'Test',
        username: 'testuser',
        email: 'test@example.com',
      };
      cacheRepository.getUserProfile.mockResolvedValueOnce(profile);

      await expect(service.getUserProfile('user-a', 'user-a')).resolves.toEqual(
        profile
      );
    });
  });
});
