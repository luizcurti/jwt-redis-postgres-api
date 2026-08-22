import { NextFunction, Request, Response } from 'express';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../src/errors/AppError';
import { errorHandler } from '../../../src/middleware/errorHandler';

describe('errorHandler middleware', () => {
  let response: Partial<Response>;
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it.each([
    [new ValidationError('bad input'), 400, 'bad input'],
    [new UnauthorizedError('no token'), 401, 'no token'],
    [new ForbiddenError('not yours'), 403, 'not yours'],
    [new NotFoundError('missing'), 404, 'missing'],
    [new ConflictError('duplicate'), 409, 'duplicate'],
  ])('maps %p to status %i', (error, status, message) => {
    errorHandler(error, {} as Request, response as Response, next);

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({ error: message });
  });

  it('maps unknown errors to a generic 500', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    errorHandler(new Error('boom'), {} as Request, response as Response, next);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Internal server error.',
    });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
