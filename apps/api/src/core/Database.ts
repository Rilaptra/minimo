// apps/api/src/core/Database.ts
import { Database } from "bun:sqlite";
import * as schema from "@minimo/db";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

/**
 * Singleton class to manage SQLite database connection and state.
 * Automatically handles schema migrations on initialization.
 */
class DatabaseService {
  private static instance: DatabaseService;
  private db: BunSQLiteDatabase<typeof schema>;

  private constructor() {
    // 1. Buat koneksi ke file SQLite (akan dibuat otomatis jika tidak ada)
    const sqlite = new Database("minimo.db");
    this.db = drizzle(sqlite, { schema });

    // 2. AUTO-MIGRATE: Pastikan tabel selalu ada!
    try {
      console.log("[DB] Memeriksa & menjalankan migrasi database...");
      migrate(this.db, { migrationsFolder: "./drizzle" });
      console.log("[DB] Database siap digunakan!");
    } catch (error) {
      console.error(
        "[DB] Gagal melakukan migrasi. Pastikan folder './drizzle' ada di root proyek.",
      );
      console.error(error);
      process.exit(1); // Hentikan app jika DB gagal di-setup
    }
  }

  /**
   * Gets the singleton instance of the database service.
   * @returns {DatabaseService} The singleton instance.
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Gets the Drizzle ORM instance for querying.
   * @returns {BunSQLiteDatabase<typeof schema>} The Drizzle ORM instance.
   */
  public getDb(): BunSQLiteDatabase<typeof schema> {
    return this.db;
  }
}

// Export the ready-to-use Drizzle instance
export const dbInstance = DatabaseService.getInstance().getDb();
