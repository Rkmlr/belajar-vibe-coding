import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserPayload {
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

  async loginUser(payload: LoginUserPayload) {
    // 1. Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email))
      .limit(1);

    if (!user) {
      throw new Error('Email atau password salah');
    }

    // 2. Verify password
    const isPasswordValid = await Bun.password.verify(payload.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email atau password salah');
    }

    // 3. Generate session token (UUID)
    const token = crypto.randomUUID();

    // 4. Save session to database
    await db.insert(sessions).values({
      token: token,
      userId: user.id,
    });

    // 5. Return the token
    return token;
  },

  async getCurrentUser(token: string) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    return user;
  },

  async logoutUser(token: string) {
    const [result] = await db.delete(sessions).where(eq(sessions.token, token));

    if (result.affectedRows === 0) {
      throw new Error("Unauthorized");
    }
  },
};

