import { Database } from "bun:sqlite";
import * as schema from "@minimo/db";
import { drizzle } from "drizzle-orm/bun-sqlite/driver";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const sqlite = new Database("minimo.db");
const db = drizzle(sqlite, { schema });

console.log("[SYS] Menjalankan migrasi database...");
migrate(db, { migrationsFolder: "./drizzle" });
console.log("[SYS] Migrasi database berhasil!");

sqlite.close();
