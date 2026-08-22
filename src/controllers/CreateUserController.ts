import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class CreateUserController {
  constructor(private readonly userService: UserService) {}

  handle = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = await this.userService.createUser(request.body);

      response
        .status(201)
        .json({ message: 'User created successfully', userId: id });
    } catch (error) {
      next(error);
    }
  };
}
