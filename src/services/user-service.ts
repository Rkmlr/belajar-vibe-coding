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
  /**
   * Mendaftarkan pengguna baru ke dalam database.
   * Melakukan pengecekan duplikasi email, melakukan hashing password dengan bcrypt,
   * dan mengembalikan data pengguna baru yang telah tersimpan.
   *
   * @param payload - Objek yang berisi name, email, dan password pengguna.
   * @returns Data pengguna yang berhasil didaftarkan (tanpa password).
   * @throws Error jika email sudah terdaftar atau gagal mengambil data setelah insert.
   */
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

  /**
   * Mengotentikasi pengguna berdasarkan email dan password.
   * Memeriksa keberadaan pengguna, memverifikasi kecocokan hash password,
   * dan membuat sesi otentikasi baru (token UUID) jika kredensial valid.
   *
   * @param payload - Objek yang berisi email dan password pengguna.
   * @returns Token sesi (UUID) sebagai string.
   * @throws Error jika email tidak ditemukan atau password tidak cocok.
   */
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

  /**
   * Mengambil data profil pengguna yang saat ini sedang login berdasarkan token sesi.
   * Memvalidasi apakah token tersebut ada di dalam database sesi dan mengambil data pengguna terkait.
   *
   * @param token - Token otentikasi (Bearer token) dari sesi pengguna.
   * @returns Objek data pengguna yang terkait dengan sesi tersebut.
   * @throws Error "Unauthorized" jika token tidak valid, sesi tidak ditemukan, atau pengguna tidak ada.
   */
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

  /**
   * Mengakhiri sesi pengguna dengan menghapus token otentikasi dari database.
   *
   * @param token - Token otentikasi sesi yang ingin dihapus.
   * @throws Error "Unauthorized" jika token tidak valid atau sesi sudah tidak ada.
   */
  async logoutUser(token: string) {
    const [result] = await db.delete(sessions).where(eq(sessions.token, token));

    if (result.affectedRows === 0) {
      throw new Error("Unauthorized");
    }
  },
};

