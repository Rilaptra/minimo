import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./db/schema";

const sqlite = new Database("minimo.db");
export const db = drizzle(sqlite, { schema });
export * from "./db/schema";
