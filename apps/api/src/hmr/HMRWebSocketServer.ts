// apps/api/src/hmr/HMRWebSocketServer.ts
import type { ServeOptions, ServerWebSocket } from "bun";
import type { HMRMessage } from "./types";

/**
 * WebSocket server yang berjalan di parent process.
 * Bertanggung jawab untuk komunikasi real-time dengan browser.
 * Tetap hidup meskipun backend (child process) di-restart.
 */
export class HMRWebSocketServer {
  private sockets = new Set<ServerWebSocket<unknown>>();
  private server: ReturnType<typeof Bun.serve> | null = null;

  constructor(private port: number) {}

  /**
   * Memulai WebSocket server pada port yang ditentukan.
   */
  start(): void {
    const options: ServeOptions = {
      port: this.port,
      fetch: (req, server) => {
        if (req.headers.get("upgrade") === "websocket") {
          if (server.upgrade(req)) {
            return new Response(null, { status: 204 }); // Bun akan ignore ini dan upgrade
          }
          return new Response("Upgrade failed", { status: 400 });
        }
        return new Response("HMR Server Active", { status: 200 });
      },
      websocket: {
        open: (ws) => {
          this.sockets.add(ws);
          this.send(ws, { type: "connected", timestamp: Date.now() });
          console.log(
            `  [HMR] 🖥️  Browser connected (${this.sockets.size} active)`,
          );
        },
        close: (ws) => {
          this.sockets.delete(ws);
          console.log(
            `  [HMR] 🖥️  Browser disconnected (${this.sockets.size} active)`,
          );
        },
        message: () => {
          // Browser tidak mengirim pesan ke server
        },
      },
    };

    this.server = Bun.serve(options);
    console.log(`  [HMR] 🔌 WebSocket server → ws://localhost:${this.port}`);
  }

  /**
   * Broadcast pesan HMR ke semua browser yang terhubung.
   */
  broadcast(message: HMRMessage): void {
    if (this.sockets.size === 0) return;
    const data = JSON.stringify(message);
    for (const ws of this.sockets) {
      try {
        ws.send(data);
      } catch {
        this.sockets.delete(ws);
      }
    }
  }

  private send(ws: ServerWebSocket<unknown>, message: HMRMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch {
      this.sockets.delete(ws);
    }
  }

  /**
   * Menghentikan WebSocket server dan menutup semua koneksi.
   */
  stop(): void {
    for (const ws of this.sockets) {
      try {
        ws.close();
      } catch {}
    }
    this.sockets.clear();
    if (this.server) {
      this.server.stop(true);
      this.server = null;
    }
  }

  get clientCount(): number {
    return this.sockets.size;
  }
}
