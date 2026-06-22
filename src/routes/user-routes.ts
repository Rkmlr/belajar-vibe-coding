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

      set.status = 500;
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan pada server',
        data: null,
      };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, error: 'Name harus diisi' }),
      email: t.String({ pattern: '^[^\\s@]+@[^\\s@]+$', error: 'Format email tidak valid' }),
      password: t.String({ minLength: 6, error: 'Password minimal 6 karakter' }),
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
      name: t.String({ minLength: 1, error: 'Name harus diisi' }),
      email: t.String({ pattern: '^[^\\s@]+@[^\\s@]+$', error: 'Format email tidak valid' }),
      password: t.String({ minLength: 6, error: 'Password minimal 6 karakter' }),
    })
  })
  .get('/users/current', async ({ headers, set }) => {
    try {
      const authHeader = headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return {
          error: 'Unauthorized',
        };
      }

      const token = authHeader.substring(7);
      const user = await UserService.getCurrentUser(token);

      return {
        data: user,
      };
    } catch (error: any) {
      set.status = 401;
      return {
        error: 'Unauthorized',
      };
    }
  });


