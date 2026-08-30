import { UserRepository } from '../../../src/repositories/UserRepository';
import {
  resetDatabase,
  testPool,
  closeTestConnections,
} from '../../testSetup/testDb';

describe('UserRepository (integration)', () => {
  const repository = new UserRepository(testPool);

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeTestConnections();
  });

  it('creates a user and finds it by username', async () => {
    await repository.create({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Test User',
      username: 'integrationuser',
      passwordHash: 'hashed-password',
      email: 'integration@example.com',
    });

    const found = await repository.findByUsername('integrationuser');

    expect(found).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Test User',
      username: 'integrationuser',
      password: 'hashed-password',
      email: 'integration@example.com',
    });
  });

  it('returns null when the username does not exist', async () => {
    const found = await repository.findByUsername('does-not-exist');

    expect(found).toBeNull();
  });

  it('reports existsByUsername correctly before and after creation', async () => {
    await expect(repository.existsByUsername('integrationuser')).resolves.toBe(
      false
    );

    await repository.create({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Test User',
      username: 'integrationuser',
      passwordHash: 'hashed-password',
      email: 'integration2@example.com',
    });

    await expect(repository.existsByUsername('integrationuser')).resolves.toBe(
      true
    );
  });

  it('reports existsByEmail correctly before and after creation', async () => {
    await expect(
      repository.existsByEmail('integration@example.com')
    ).resolves.toBe(false);

    await repository.create({
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Test User',
      username: 'emailcheckuser',
      passwordHash: 'hashed-password',
      email: 'integration@example.com',
    });

    await expect(
      repository.existsByEmail('integration@example.com')
    ).resolves.toBe(true);
  });

  it('rejects a second user with a duplicate username (unique constraint)', async () => {
    await repository.create({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Test User',
      username: 'duplicateuser',
      passwordHash: 'hashed-password',
      email: 'first@example.com',
    });

    await expect(
      repository.create({
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Another User',
        username: 'duplicateuser',
        passwordHash: 'hashed-password',
        email: 'second@example.com',
      })
    ).rejects.toThrow();
  });
});
