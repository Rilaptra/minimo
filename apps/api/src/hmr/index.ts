// apps/api/src/hmr/index.ts

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DevServer } from "./DevServer";
import type { HMRConfig } from "./types";

/**
 * Entry point untuk HMR development server.
 *
 * Jalankan dengan: bun run dev
 *
 * Fitur:
 * - Auto-rebuild frontend saat file web/ berubah
 * - Auto-restart backend saat file api/ berubah
 * - Hot CSS swap (tanpa page reload)
 * - Error overlay di browser saat build gagal
 * - Auto-reconnect WebSocket saat server restart
 */

// Pastikan embedded-assets.ts ada (dibutuhkan oleh import di App.ts)
const embeddedPath = join(import.meta.dir, "../embedded-assets.ts");
if (!existsSync(embeddedPath)) {
  writeFileSync(
    embeddedPath,
    '// Auto-generated placeholder. In dev mode, assets are served from dist/.\nexport const clientJs = "";\nexport const stylesCss = "";\n',
    "utf-8",
  );
}

const config: HMRConfig = {
  serverPort: 3000,
  hmrPort: 3001,
  debounceMs: 150,
  watchPaths: [
    {
      // Backend source files
      path: join(import.meta.dir, "../"),
      category: "backend",
      ignore: [
        /node_modules/,
        /\.db$/,
        /embedded-assets\.ts$/,
        /\/hmr\//, // Jangan watch dir sendiri
      ],
    },
    {
      // Frontend source files
      path: join(import.meta.dir, "../../../web/src/"),
      category: "frontend",
      ignore: [/node_modules/],
    },
    {
      // Shared packages (db schema, dll)
      path: join(import.meta.dir, "../../../../packages/"),
      category: "shared",
      ignore: [/node_modules/, /\/tui\//],
    },
  ],
};

const devServer = new DevServer(config);
devServer.start().catch((err) => {
  console.error("[HMR] Failed to start:", err);
  process.exit(1);
});
