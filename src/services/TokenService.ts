import { sign, verify } from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';

const TOKEN_EXPIRES_IN = '1h';

export class TokenService {
  sign(subject: string): string {
    return sign({}, this.getSecret(), {
      subject,
      expiresIn: TOKEN_EXPIRES_IN,
    });
  }

  verify(token: string): { subject: string } {
    try {
      const decoded = verify(token, this.getSecret()) as { sub: string };

      return { subject: decoded.sub };
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }

  private getSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    return secret;
  }
}
