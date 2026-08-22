import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../src/errors/AppError';

const verifyMock = jest.fn();

jest.mock('../../../src/services/TokenService', () => ({
  TokenService: jest.fn().mockImplementation(() => ({ verify: verifyMock })),
}));

import { authentication } from '../../../src/middleware/auth';

describe('authentication middleware', () => {
  let request: Partial<Request>;
  let response: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
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
    verifyMock.mockImplementation(() => {
      throw new UnauthorizedError('Invalid token');
    });

    expect(() =>
      authentication(request as Request, response as Response, next)
    ).toThrow(UnauthorizedError);
  });

  it('sets request.userId and calls next on a valid token', () => {
    request.headers = { authorization: 'Bearer good-token' };
    verifyMock.mockReturnValue({ subject: 'user-1' });

    authentication(request as Request, response as Response, next);

    expect(request.userId).toBe('user-1');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
