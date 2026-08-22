import { NextFunction, Request, RequestHandler, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { TokenService } from '../services/TokenService';

export function createAuthMiddleware(
  tokenService: TokenService
): RequestHandler {
  return function authentication(
    request: Request,
    response: Response,
    next: NextFunction
  ): void {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Token missing');
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new UnauthorizedError('Invalid token');
    }

    const { subject } = tokenService.verify(token);
    request.userId = subject;

    next();
  };
}
