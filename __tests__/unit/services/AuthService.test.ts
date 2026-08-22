import {
  UnauthorizedError,
  ValidationError,
} from '../../../src/errors/AppError';
import { CacheRepository } from '../../../src/repositories/CacheRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { AuthService } from '../../../src/services/AuthService';
import { TokenService } from '../../../src/services/TokenService';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { compare } from 'bcryptjs';

describe('AuthService', () => {
  let userRepository: jest.Mocked<Pick<UserRepository, 'findByUsername'>>;
  let cacheRepository: jest.Mocked<Pick<CacheRepository, 'setUserProfile'>>;
  let tokenService: jest.Mocked<Pick<TokenService, 'sign'>>;
  let service: AuthService;

  const storedUser = {
    id: 'user-1',
    name: 'Test User',
    username: 'testuser',
    password: 'hashed-password',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = { findByUsername: jest.fn() };
    cacheRepository = { setUserProfile: jest.fn() };
    tokenService = { sign: jest.fn().mockReturnValue('signed-token') };
    service = new AuthService(
      userRepository as unknown as UserRepository,
      cacheRepository as unknown as CacheRepository,
      tokenService as unknown as TokenService
    );
  });

  it('throws ValidationError when username or password is missing', async () => {
    await expect(service.login({ username: 'testuser' })).rejects.toThrow(
      ValidationError
    );
  });

  it('throws UnauthorizedError when the user does not exist', async () => {
    userRepository.findByUsername.mockResolvedValueOnce(null);

    await expect(
      service.login({ username: 'missing', password: 'password123' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when the password does not match', async () => {
    userRepository.findByUsername.mockResolvedValueOnce(storedUser);
    (compare as jest.Mock).mockResolvedValueOnce(false);

    await expect(
      service.login({ username: 'testuser', password: 'wrongpassword' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('returns a token and caches the profile on success', async () => {
    userRepository.findByUsername.mockResolvedValueOnce(storedUser);
    (compare as jest.Mock).mockResolvedValueOnce(true);

    const result = await service.login({
      username: 'testuser',
      password: 'password123',
    });

    expect(result).toEqual({
      token: 'signed-token',
      user: {
        id: 'user-1',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
      },
    });
    expect(cacheRepository.setUserProfile).toHaveBeenCalledWith(
      'user-1',
      result.user
    );
  });
});
