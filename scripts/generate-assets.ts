// scripts/generate-assets.ts
import { existsSync, readFileSync, writeFileSync } from "fs";

console.log(`\n[Embed] Meng-embed file statis ke kode backend...`);
const clientJsPath = "apps/web/dist/client.js";
const stylesCssPath = "apps/web/dist/styles.css";

if (!existsSync(clientJsPath) || !existsSync(stylesCssPath)) {
  console.error(
    "❌ File frontend belum di-build! Jalankan 'bun run build:web' terlebih dahulu.",
  );
  process.exit(1);
}

const clientJsContent = readFileSync(clientJsPath, "utf-8");
const stylesCssContent = readFileSync(stylesCssPath, "utf-8");

const embeddedCode = `// File ini di-generate otomatis oleh script. JANGAN DIUBAH MANUAL.
export const clientJs = ${JSON.stringify(clientJsContent)};
export const stylesCss = ${JSON.stringify(stylesCssContent)};
`;

writeFileSync("apps/api/src/embedded-assets.ts", embeddedCode, "utf-8");
console.log(`[Embed] embedded-assets.ts berhasil diperbarui! 🎉`);
