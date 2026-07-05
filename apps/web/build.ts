import { join } from "node:path";

const result = await Bun.build({
  // File entrypoint untuk kode React di sisi klien (browser)
  entrypoints: [join(import.meta.dir, "src/client.tsx")],
  // Hasil build akan ditaruh di folder dist/
  outdir: join(import.meta.dir, "dist"),
  // Nama file output
  naming: "client.js",
  minify: true,
  target: "browser",
  format: "esm",
});

if (!result.success) {
  console.error("[ERR] Kompilasi Frontend Gagal:", result.logs);
  process.exit(1);
}

console.log("[SYS] Kompilasi Frontend Berhasil (dist/client.js)");
