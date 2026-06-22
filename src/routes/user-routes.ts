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
    })
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
    })
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
        const auth = headers['authorization']!;
        const token = auth.split(" ")[1] ?? "";
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
      })
  );


