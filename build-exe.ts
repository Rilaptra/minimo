import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync } from "fs";

console.log("🛠️ Pilih target OS untuk build executable:");
console.log("1. Windows (x64)");
console.log("2. Raspberry Pi 3 B (Linux ARM64)");

const target = prompt("Masukkan pilihan (1 atau 2): ");

let bunTarget = "";
let outFile = "";

if (target === "1") {
  bunTarget = "bun-windows-x64";
  outFile = "minimo-win.exe";
} else if (target === "2") {
  bunTarget = "bun-linux-arm64";
  outFile = "minimo-pi";
} else {
  console.error("❌ Pilihan tidak valid!");
  process.exit(1);
}

console.log(`\n[1/4] Membuild Frontend (React + Tailwind)...`);
await $`bun run build:web`.quiet();

console.log(`[2/4] Meng-embed file statis ke kode backend...`);
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

// Tulis file TypeScript yang berisi string literal dari CSS dan JS
// JSON.stringify memastikan string aman dari karakter aneh (escape quotes dll)
const embeddedCode = `// File ini di-generate otomatis oleh build-exe.ts. JANGAN DIUBAH MANUAL.
export const clientJs = ${JSON.stringify(clientJsContent)};
export const stylesCss = ${JSON.stringify(stylesCssContent)};
`;

writeFileSync("apps/api/src/embedded-assets.ts", embeddedCode, "utf-8");

console.log(`[3/4] Mengkompilasi ke Single File Executable (${bunTarget})...`);
await $`bun build apps/api/src/index.ts --compile --target ${bunTarget} --outfile ${outFile}`.quiet();

console.log(`[4/4] Build selesai! 🎉`);
console.log(`\n📁 File executable tersimpan sebagai: ${outFile}`);
console.log(
  `⚠️  Pastikan file 'minimo.db' berada di folder yang sama saat Anda menjalankan file executable tersebut.`,
);
