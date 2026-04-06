import 'server-only';

import type { User } from '@/lib/types';
import { query } from '@/lib/postgres';
import { hashPassword, verifyPassword } from '@/lib/password';

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  role: User['role'];
  photo_url: string;
  is_active: boolean;
  password_hash: string | null;
  created_at: Date | string;
  last_login: Date | string;
};

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    photoURL: row.photo_url,
    isActive: row.is_active,
    createdAt: asDate(row.created_at),
    lastLogin: asDate(row.last_login),
  };
}

export async function getUserCount() {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  return Number(result.rows[0]?.count ?? 0);
}

export async function listUsers() {
  const result = await query<UserRow>(
    `
      SELECT
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
      FROM users
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapUser);
}

export async function getUserById(userId: string) {
  const result = await query<UserRow>(
    `
      SELECT
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

async function getUserRowByEmail(email: string) {
  const result = await query<UserRow>(
    `
      SELECT
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

async function getUserRowById(userId: string) {
  const result = await query<UserRow>(
    `
      SELECT
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function authenticateUser(email: string, password: string) {
  const userRow = await getUserRowByEmail(email);

  if (!userRow || !userRow.password_hash) {
    return { user: null, reason: 'invalid_credentials' as const };
  }

  if (!verifyPassword(password, userRow.password_hash)) {
    return { user: null, reason: 'invalid_credentials' as const };
  }

  if (!userRow.is_active) {
    return { user: null, reason: 'inactive' as const };
  }

  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [userRow.id]);

  return { user: mapUser({ ...userRow, last_login: new Date() }), reason: null };
}

export async function createInitialAdmin(email: string, password: string) {
  const userCount = await getUserCount();

  if (userCount > 0) {
    throw new Error('Ya existe al menos un usuario en el sistema.');
  }

  const existingUser = await getUserRowByEmail(email);
  if (existingUser) {
    throw new Error('El correo electrónico ya está en uso.');
  }

  const passwordHash = hashPassword(password);

  const result = await query<UserRow>(
    `
      INSERT INTO users (
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        'admin',
        $3,
        TRUE,
        $4
      )
      RETURNING
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
    `,
    [email, 'Admin', `https://i.pravatar.cc/150?u=${email}`, passwordHash]
  );

  return mapUser(result.rows[0]);
}

type CreateUserInput = {
  displayName: string;
  email: string;
  role: User['role'];
  password: string;
};

type UpdateUserInput = {
  displayName: string;
  role: User['role'];
};

export async function createUser(input: CreateUserInput) {
  const existingUser = await getUserRowByEmail(input.email);
  if (existingUser) {
    throw new Error('El correo electronico ya esta en uso.');
  }

  const passwordHash = hashPassword(input.password);

  const result = await query<UserRow>(
    `
      INSERT INTO users (
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash
      )
      VALUES (
        gen_random_uuid()::text,
        $1,
        $2,
        $3,
        $4,
        TRUE,
        $5
      )
      RETURNING
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
    `,
    [
      input.email,
      input.displayName,
      input.role,
      `https://i.pravatar.cc/150?u=${input.email}`,
      passwordHash,
    ]
  );

  return mapUser(result.rows[0]);
}

export async function updateUser(userId: string, input: UpdateUserInput) {
  const result = await query<UserRow>(
    `
      UPDATE users
      SET
        display_name = $2,
        role = $3
      WHERE id = $1
      RETURNING
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
    `,
    [userId, input.displayName, input.role]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const result = await query<UserRow>(
    `
      UPDATE users
      SET is_active = $2
      WHERE id = $1
      RETURNING
        id,
        email,
        display_name,
        role,
        photo_url,
        is_active,
        password_hash,
        created_at,
        last_login
    `,
    [userId, isActive]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const userRow = await getUserRowById(userId);

  if (!userRow || !userRow.password_hash) {
    throw new Error('Usuario no encontrado.');
  }

  if (!verifyPassword(currentPassword, userRow.password_hash)) {
    throw new Error('La contrasena actual no es valida.');
  }

  const nextHash = hashPassword(newPassword);

  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, nextHash]);
}
