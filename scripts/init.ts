import { rename, readFile, writeFile } from "fs/promises";

console.log("🚀 Memulai setup proyek baru...");
const projectName = prompt("Masukkan nama proyek baru: ");

// 1. Ganti nama di package.json
const pkg = await readFile("package.json", "utf-8");
const newPkg = pkg.replace(/"minimo-template"/, `"${projectName}"`);
await writeFile("package.json", newPkg);

console.log(`✅ Proyek ${projectName} siap digunakan!`);
