import { randomUUID } from 'crypto';
import { hash } from 'bcryptjs';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../errors/AppError';
import { CacheRepository } from '../repositories/CacheRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UserPublic } from '../types/user';

const BCRYPT_SALT_ROUNDS = 12;

export type CreateUserInput = {
  username?: string;
  name?: string;
  password?: string;
  email?: string;
};

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheRepository: CacheRepository
  ) {}

  async createUser(input: CreateUserInput): Promise<{ id: string }> {
    const { username, name, password, email } = input;

    if (!username || !name || !password || !email) {
      throw new ValidationError('Missing required fields.');
    }

    const usernameTaken = await this.userRepository.existsByUsername(username);

    if (usernameTaken) {
      throw new ConflictError('Username already taken.');
    }

    const emailTaken = await this.userRepository.existsByEmail(email);

    if (emailTaken) {
      throw new ConflictError('Email already registered.');
    }

    const passwordHash = await hash(password, BCRYPT_SALT_ROUNDS);
    const id = randomUUID();

    await this.userRepository.create({
      id,
      name,
      username,
      passwordHash,
      email,
    });

    return { id };
  }

  async getUserProfile(
    requestingUserId: string,
    targetUserId: string
  ): Promise<UserPublic> {
    if (requestingUserId !== targetUserId) {
      throw new ForbiddenError('You are not allowed to access this profile.');
    }

    const profile = await this.cacheRepository.getUserProfile(targetUserId);

    if (!profile) {
      throw new NotFoundError('User not found in cache.');
    }

    return profile;
  }
}
