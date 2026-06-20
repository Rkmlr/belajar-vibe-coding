import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export const UserService = {
  async registerUser(payload: RegisterUserPayload) {
    // 1. Check if email already exists
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1);

    if (existingUsers.length > 0) {
      throw new Error('Email sudah terdaftar');
    }

    // 2. Hash password using Bun's native password hashing (bcrypt)
    const hashedPassword = await Bun.password.hash(payload.password, 'bcrypt');

    // 3. Insert user into MySQL
    const [result] = await db.insert(users).values({
      username: payload.name, // Mapping 'name' to 'username'
      email: payload.email,
      password: hashedPassword,
    });

    const newUserId = result.insertId;

    // 4. Query the newly inserted user (excluding password)
    const [newUser] = await db
      .select({
        id: users.id,
        name: users.username, // Map 'username' back to 'name' for the output
        email: users.email,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, newUserId))
      .limit(1);

    if (!newUser) {
      throw new Error('Gagal mengambil data user yang baru dibuat');
    }

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      created_at: newUser.createdAt,
      updated_at: newUser.updatedAt,
    };
  },
};
