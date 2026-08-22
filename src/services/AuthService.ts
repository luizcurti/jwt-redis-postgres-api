import { compare } from 'bcryptjs';
import { UnauthorizedError, ValidationError } from '../errors/AppError';
import { CacheRepository } from '../repositories/CacheRepository';
import { UserRepository } from '../repositories/UserRepository';
import { toPublicUser, UserPublic } from '../types/user';
import { TokenService } from './TokenService';

export type LoginInput = {
  username?: string;
  password?: string;
};

export type LoginResult = {
  token: string;
  user: UserPublic;
};

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cacheRepository: CacheRepository,
    private readonly tokenService: TokenService
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const { username, password } = input;

    if (!username || !password) {
      throw new ValidationError('Username and password are required.');
    }

    const user = await this.userRepository.findByUsername(username);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const token = this.tokenService.sign(user.id);
    const publicUser = toPublicUser(user);

    await this.cacheRepository.setUserProfile(user.id, publicUser);

    return { token, user: publicUser };
  }
}
