import { NextFunction, Request, RequestHandler, Response } from 'express';
import { UnauthorizedError } from '../../../src/errors/AppError';
import { createAuthMiddleware } from '../../../src/middleware/auth';
import { TokenService } from '../../../src/services/TokenService';

describe('authentication middleware', () => {
  let tokenService: jest.Mocked<Pick<TokenService, 'verify'>>;
  let authentication: RequestHandler;
  let request: Partial<Request>;
  let response: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    tokenService = { verify: jest.fn() };
    authentication = createAuthMiddleware(
      tokenService as unknown as TokenService
    );
    request = { headers: {} };
    response = {};
    next = jest.fn();
  });

  it('throws UnauthorizedError when the header is missing', () => {
    expect(() =>
      authentication(request as Request, response as Response, next)
    ).toThrow('Token missing');
    expect(next).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the header has no token', () => {
    request.headers = { authorization: 'Bearer' };

    expect(() =>
      authentication(request as Request, response as Response, next)
    ).toThrow('Invalid token');
  });

  it('propagates the error thrown by TokenService.verify', () => {
    request.headers = { authorization: 'Bearer bad-token' };
    tokenService.verify.mockImplementation(() => {
      throw new UnauthorizedError('Invalid token');
    });

    expect(() =>
      authentication(request as Request, response as Response, next)
    ).toThrow(UnauthorizedError);
  });

  it('sets request.userId and calls next on a valid token', () => {
    request.headers = { authorization: 'Bearer good-token' };
    tokenService.verify.mockReturnValue({ subject: 'user-1' });

    authentication(request as Request, response as Response, next);

    expect(request.userId).toBe('user-1');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
