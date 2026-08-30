import { Pool } from 'pg';
import { UserRecord } from '../types/user';

export type NewUser = {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  email: string;
};

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByUsername(username: string): Promise<UserRecord | null> {
    const { rows } = await this.pool.query<UserRecord>(
      `SELECT ID, NAME, USERNAME, PASSWORD, EMAIL FROM USERS WHERE USERNAME = $1 LIMIT 1`,
      [username]
    );

    return rows[0] ?? null;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM USERS WHERE USERNAME = $1 LIMIT 1`,
      [username]
    );

    return rows.length > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM USERS WHERE EMAIL = $1 LIMIT 1`,
      [email]
    );

    return rows.length > 0;
  }

  async create(user: NewUser): Promise<void> {
    await this.pool.query(
      `INSERT INTO USERS (ID, NAME, USERNAME, PASSWORD, EMAIL) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, user.name, user.username, user.passwordHash, user.email]
    );
  }
}
