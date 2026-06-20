import { Elysia } from 'elysia';
import { db } from './db';
import { users } from './db/schema';
import { userRoutes } from './routes/user-routes';

const port = process.env.PORT || 3000;

const app = new Elysia()
  .use(userRoutes)
  .get('/', () => ({ 
    message: 'Welcome to Elysia + Drizzle + MySQL project running on Bun!' 
  }))
  .get('/test-db', async ({ set }) => {
    try {
      // Test query to fetch users from the database
      const result = await db.select().from(users).limit(5);
      return {
        status: 'success',
        message: 'Successfully connected to MySQL database!',
        data: result,
      };
    } catch (error: any) {
      set.status = 500;
      return {
        status: 'error',
        message: 'Failed to connect to database.',
        error: error.message || String(error),
      };
    }
  })
  .listen(port);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
