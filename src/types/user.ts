export type UserRecord = {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
};

export type UserPublic = {
  id: string;
  name: string;
  username: string;
  email: string;
};

export function toPublicUser(user: UserRecord): UserPublic {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
  };
}
