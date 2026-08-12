import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env.js';

// On cloud providers (Render, AWS RDS, etc.), TLS/SSL is required.
// We detect by checking if the DATABASE_URL already contains sslmode or
// if it's not localhost. We set rejectUnauthorized: false to allow self-signed certs.
const isLocalhost = env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
