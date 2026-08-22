import { UnauthorizedError } from '../../../src/errors/AppError';
import { TokenService } from '../../../src/services/TokenService';

describe('TokenService', () => {
  const originalSecret = process.env.JWT_SECRET;
  let tokenService: TokenService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-secret';
    tokenService = new TokenService();
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  describe('sign', () => {
    it('signs a token whose subject can be recovered by verify', () => {
      const token = tokenService.sign('user-1');

      expect(tokenService.verify(token)).toEqual({ subject: 'user-1' });
    });

    it('throws when JWT_SECRET is not set', () => {
      delete process.env.JWT_SECRET;

      expect(() => tokenService.sign('user-1')).toThrow(
        'JWT_SECRET environment variable is not set'
      );
    });
  });

  describe('verify', () => {
    it('throws UnauthorizedError for a malformed token', () => {
      expect(() => tokenService.verify('not-a-real-token')).toThrow(
        UnauthorizedError
      );
    });

    it('throws UnauthorizedError for a token signed with a different secret', () => {
      const token = tokenService.sign('user-1');
      process.env.JWT_SECRET = 'a-different-secret';

      expect(() => tokenService.verify(token)).toThrow(UnauthorizedError);
    });
  });
});
