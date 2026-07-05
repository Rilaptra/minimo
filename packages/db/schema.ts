import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Tabel Rumah (Warga)
export const houses = sqliteTable("houses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Kode unik untuk QR Code (contoh: JMT-001)
  code: text("code").notNull().unique(),
  ownerName: text("owner_name").notNull(),
  address: text("address").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Tabel Setoran Jimpitan
export const contributions = sqliteTable("contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  houseId: integer("house_id")
    .notNull()
    .references(() => houses.id),
  amount: integer("amount").notNull(), // Nominal dalam Rupiah
  // Status: 'pending' (menunggu dikumpulkan) atau 'collected' (sudah dikumpulkan rt)
  status: text("status", { enum: ["pending", "collected"] }).default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});
