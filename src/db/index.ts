import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const connectionUri = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/belajar_vibe_coding';

const pool = mysql.createPool({
  uri: connectionUri,
});

export const db = drizzle(pool, { schema, mode: 'default' });
