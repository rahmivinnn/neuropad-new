import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as sqliteDrizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
export const hasDatabase = Boolean(process.env.DATABASE_URL);

let sqlite = undefined;
if (!hasDatabase) {
  sqlite = new Database('local.db');
}

export const pool = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (undefined as any);

export const db = hasDatabase
  ? neonDrizzle({ client: pool, schema })
  : sqliteDrizzle(sqlite!, { schema });