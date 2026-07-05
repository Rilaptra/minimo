// apps/api/src/hmr/DevServer.ts

import { join } from "node:path";
import { type FileChangeEvent, FileWatcher } from "./FileWatcher";
import { FrontendBuilder } from "./FrontendBuilder";
import { HMRWebSocketServer } from "./HMRWebSocketServer";
import type { HMRConfig, HMRMessage } from "./types";

/**
 * Main orchestrator untuk HMR system.
 */
export class DevServer {
  private wsServer: HMRWebSocketServer;
  private watcher: FileWatcher;
  private builder: FrontendBuilder;
  private childProc: ReturnType<typeof Bun.spawn> | null = null;
  private config: HMRConfig;
  private isRestarting = false;
  private isBuilding = false;
  private buildQueue: FileChangeEvent[] = [];

  constructor(config: HMRConfig) {
    this.config = config;
    this.wsServer = new HMRWebSocketServer(config.hmrPort);
    this.builder = new FrontendBuilder();
    this.watcher = new FileWatcher(
      config.watchPaths,
      (events) => this.onFileChange(events),
      config.debounceMs,
    );
  }

  /**
   * Memulai seluruh sistem HMR.
   */
  async start(): Promise<void> {
    console.log("\n┌──────────────────────────────────────────────────┐");
    console.log("│  🔥 Minimo HMR — Custom Hot Module Replacement    │");
    console.log("└──────────────────────────────────────────────────┘\n");

    // 1. Initial frontend build
    console.log("→ [1/4] Building frontend (initial)...");
    const buildResult = await this.builder.buildAll();
    if (!buildResult.success) {
      console.error("  ⚠️  Initial build gagal:");
      for (const err of buildResult.errors) {
        console.error("     ", err);
      }
      console.error("  Melanjutkan... (file akan dibuat saat dev)\n");
    } else {
      console.log(`  ✅ Frontend siap (${buildResult.duration}ms)\n`);
    }

    // 2. Start WebSocket server
    console.log("→ [2/4] Starting HMR WebSocket server...");
    this.wsServer.start();

    // 3. Start file watcher
    console.log("→ [3/4] Starting file watcher...");
    this.watcher.start();

    // 4. Start backend server (child process)
    console.log("\n→ [4/4] Starting backend server...\n");
    this.startBackend();

    // Graceful shutdown
    const shutdown = () => this.shutdown();
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    console.log("\n┌──────────────────────────────────────────────────┐");
    console.log("│  🎉 HMR Active! Edit file untuk melihat perubahan │");
    console.log(
      "│  Backend: http://localhost:" +
        this.config.serverPort +
        "                   │",
    );
    console.log(
      "│  HMR WS:  ws://localhost:" +
        this.config.hmrPort +
        "                   │",
    );
    console.log("└──────────────────────────────────────────────────┘\n");
  }

  /**
   * Memulai backend server sebagai child process.
   */
  private startBackend(): void {
    const entryPoint = join(import.meta.dir, "../index.ts");

    this.childProc = Bun.spawn(["bun", entryPoint], {
      stdout: "inherit",
      stderr: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        HMR_ENABLED: "true",
        HMR_WS_PORT: String(this.config.hmrPort),
        NODE_ENV: "development",
      },
    });

    this.childProc.exited.then((code) => {
      if (this.isRestarting) return;
      if (code !== 0 && code !== null) {
        console.log(`\n  [HMR] ⚠️  Backend exit (code ${code})`);
        console.log("  [HMR] Menunggu perubahan file untuk restart...\n");
      }
    });
  }

  /**
   * Restart backend server: kill child process lalu mulai baru.
   */
  private async restartBackend(): Promise<void> {
    if (this.isRestarting || !this.childProc) return;
    this.isRestarting = true;

    console.log("\n  [HMR] ♻️  Restarting backend server...");

    this.childProc.kill("SIGTERM");

    // Tunggu exit dengan timeout
    try {
      await Promise.race([
        this.childProc.exited,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000),
        ),
      ]);
    } catch {
      console.log("  [HMR] Force killing backend...");
      this.childProc.kill("SIGKILL");
      try {
        await this.childProc.exited;
      } catch {}
    }

    this.startBackend();

    // Beri waktu server untuk start
    await new Promise((r) => setTimeout(r, 300));

    this.isRestarting = false;
    console.log("  [HMR] ✅ Backend restarted\n");

    this.broadcast({ type: "full-reload", timestamp: Date.now() });
  }

  /**
   * Handler saat file berubah.
   */
  private async onFileChange(events: FileChangeEvent[]): Promise<void> {
    if (this.isBuilding) {
      this.buildQueue.push(...events);
      return;
    }

    // Deduplicate & categorize
    const categories = new Set(events.map((e) => e.category));
    const files = [...new Set(events.map((e) => e.filename))];

    console.log(`\n  [HMR] 📝 Changed: ${files.join(", ")}`);

    const needsFrontendBuild =
      categories.has("frontend") || categories.has("shared");
    const needsBackendRestart =
      categories.has("backend") || categories.has("shared");

    // Notify browser: building
    this.broadcast({ type: "building", timestamp: Date.now() });

    this.isBuilding = true;
    let shouldFullReload = false;

    try {
      if (needsFrontendBuild) {
        // Cek apakah hanya CSS yang berubah
        const cssOnly = files.every((f) => f.endsWith(".css"));

        if (cssOnly) {
          console.log("  [HMR] → Rebuilding CSS only...");
          const result = await this.builder.buildCSS();
          if (result.success) {
            console.log(`  [HMR] ✅ CSS rebuilt (${result.duration}ms)`);
            this.broadcast({ type: "css-update", timestamp: Date.now() });
          } else {
            console.error("  [HMR] ❌ CSS build failed");
            this.broadcast({
              type: "error",
              timestamp: Date.now(),
              data: result.errors.join("\n"),
            });
          }
        } else {
          console.log("  [HMR] → Rebuilding frontend (JS + CSS)...");
          const result = await this.builder.buildAll();
          if (result.success) {
            console.log(`  [HMR] ✅ Frontend rebuilt (${result.duration}ms)`);
            shouldFullReload = true;
          } else {
            console.error("  [HMR] ❌ Frontend build failed");
            this.broadcast({
              type: "error",
              timestamp: Date.now(),
              data: result.errors.join("\n"),
            });
          }
        }
      }

      if (needsBackendRestart) {
        await this.restartBackend();
        // restartBackend() sudah mengirim full-reload
        shouldFullReload = false;
      }

      if (shouldFullReload) {
        // Fix exactOptionalPropertyTypes error
        const msg: HMRMessage = { type: "full-reload", timestamp: Date.now() };
        if (files[0]) {
          msg.file = files[0];
        }
        this.broadcast(msg);
      }
    } catch (err) {
      console.error("  [HMR] ❌ Unexpected error:", err);
      this.broadcast({
        type: "error",
        timestamp: Date.now(),
        data: String(err),
      });
    } finally {
      this.isBuilding = false;

      // Process queued events
      if (this.buildQueue.length > 0) {
        const queued = this.buildQueue.splice(0);
        this.onFileChange(queued);
      }
    }
  }

  private broadcast(message: HMRMessage): void {
    this.wsServer.broadcast(message);
  }

  /**
   * Graceful shutdown.
   */
  private shutdown(): void {
    console.log("\n\n  [HMR] Shutting down...");
    this.watcher.stop();
    this.wsServer.stop();
    if (this.childProc) {
      this.childProc.kill("SIGTERM");
    }
    setTimeout(() => process.exit(0), 500);
  }
}
