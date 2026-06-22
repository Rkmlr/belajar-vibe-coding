import { Elysia, t } from 'elysia';
import { UserService } from '../services/user-service';

export const userRoutes = new Elysia({ prefix: '/api' })
  .post('/users', async ({ body, set }) => {
    try {
      const newUser = await UserService.registerUser({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      return {
        success: true,
        message: 'User berhasil ditambahkan',
        data: newUser,
      };
    } catch (error: any) {
      if (error.message === 'Email sudah terdaftar') {
        set.status = 400;
        return {
          success: false,
          message: 'Email sudah terdaftar',
          data: null,
        };
      }

      console.error(error);
      set.status = 500;
      return {
        success: false,
        message: 'Terjadi kesalahan internal pada server',
        data: null,
      };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 255, error: 'Nama tidak valid, harus diisi dan maksimal 255 karakter' }),
      email: t.String({ pattern: '^[^\\s@]+@[^\\s@]+$', maxLength: 255, error: 'Format email tidak valid atau terlalu panjang' }),
      password: t.String({ minLength: 6, maxLength: 72, error: 'Password tidak valid, minimal 6 dan maksimal 72 karakter' }),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Object({
          id: t.Number(),
          name: t.String(),
          email: t.String(),
          created_at: t.Any(),
          updated_at: t.Any(),
        })
      }),
      400: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null(),
      }),
      500: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.Null(),
      })
    },
    detail: {
      tags: ['Users API'],
      summary: 'Registrasi Pengguna Baru',
      description: 'Mendaftarkan pengguna baru dengan username, email, dan password.',
    }
  })
  .post('/users/login', async ({ body, set }) => {
    try {
      const token = await UserService.loginUser({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      return {
        success: true,
        message: 'User berhasil login',
        data: token,
      };
    } catch (error: any) {
      set.status = 401;
      return {
        success: false,
        message: 'Email atau password salah',
        error: 'Email atau password salah',
      };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 255, error: 'Nama tidak valid, harus diisi dan maksimal 255 karakter' }),
      email: t.String({ pattern: '^[^\\s@]+@[^\\s@]+$', maxLength: 255, error: 'Format email tidak valid atau terlalu panjang' }),
      password: t.String({ minLength: 6, maxLength: 72, error: 'Password tidak valid, minimal 6 dan maksimal 72 karakter' }),
    }),
    response: {
      200: t.Object({
        success: t.Boolean(),
        message: t.String(),
        data: t.String(),
      }),
      401: t.Object({
        success: t.Boolean(),
        message: t.String(),
        error: t.String(),
      })
    },
    detail: {
      tags: ['Users API'],
      summary: 'Login Pengguna',
      description: 'Mengotentikasi pengguna menggunakan email dan password, mengembalikan token sesi (Bearer token).',
    }
  })
  .group('', (app) =>
    app
      .onBeforeHandle(({ headers, set }) => {
        const auth = headers['authorization'];
        if (!auth || !auth.startsWith('Bearer ')) {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
      })
      .derive(({ headers }) => {
        const auth = headers['authorization'];
        const token = auth && auth.startsWith('Bearer ') ? auth.split(" ")[1] ?? "" : "";
        return { token };
      })
      .get('/users/current', async ({ token, set }) => {
        try {
          const user = await UserService.getCurrentUser(token);

          return {
            data: {
              id: user.id,
              name: user.username,
              email: user.email,
              created_at: user.createdAt,
            },
          };
        } catch (error: any) {
          set.status = 401;
          return { error: error.message || 'Unauthorized' };
        }
      }, {
        response: {
          200: t.Object({
            data: t.Object({
              id: t.Number(),
              name: t.String(),
              email: t.String(),
              created_at: t.Any(),
            })
          }),
          401: t.Object({
            error: t.String()
          })
        },
        detail: {
          tags: ['Users API'],
          summary: 'Dapatkan Profil Pengguna Saat Ini',
          description: 'Mengembalikan data profil pengguna yang sedang login berdasarkan Bearer token.',
          security: [{ BearerAuth: [] }],
        }
      })
      .delete('/users/logout', async ({ token, set }) => {
        try {
          await UserService.logoutUser(token);

          return {
            data: 'OK',
          };
        } catch (error: any) {
          set.status = 401;
          return { error: error.message || 'Unauthorized' };
        }
      }, {
        response: {
          200: t.Object({
            data: t.String()
          }),
          401: t.Object({
            error: t.String()
          })
        },
        detail: {
          tags: ['Users API'],
          summary: 'Logout Pengguna',
          description: 'Menghapus token sesi aktif pengguna dari database.',
          security: [{ BearerAuth: [] }],
        }
      })
  );


