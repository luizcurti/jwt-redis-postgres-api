import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class LoginUserController {
  constructor(private readonly authService: AuthService) {}

  handle = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, user } = await this.authService.login(request.body);

      response.status(200).json({ message: 'Login successful', token, user });
    } catch (error) {
      next(error);
    }
  };
}
