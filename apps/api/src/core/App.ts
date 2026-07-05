// apps/api/src/core/App.ts

import { existsSync } from "node:fs";
import { join } from "node:path";
import { App as WebApp } from "@minimo/web";
import Elysia from "elysia";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { clientJs, stylesCss } from "../embedded-assets";
import { generateHMRClientScript } from "../hmr/hmrClientScript";

const isDev = process.env.HMR_ENABLED === "true";
const hmrPort = Number(process.env.HMR_WS_PORT || "3001");

/**
 * Interface for module registration.
 */
export interface AppModule {
  name: string;
  // biome-ignore lint/suspicious/noExplicitAny: Elysia's complex generic typing requires 'any' here.
  plugin: any;
}

/**
 * Core Application Server Class.
 */
export class AppServer {
  private elysia: Elysia;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.elysia = new Elysia();
  }

  /**
   * Registers static file routes (CSS and JS).
   * In dev mode: serves from dist/ files (hot-swappable).
   * In production: serves from embedded assets.
   */
  public registerStaticAssets(): this {
    if (isDev) {
      // DEV MODE: Serve from dist files with no-cache headers
      const clientJsPath = join(import.meta.dir, "../../../web/dist/client.js");
      const stylesCssPath = join(
        import.meta.dir,
        "../../../web/dist/styles.css",
      );

      this.elysia
        .get("/public/client.js", () => {
          if (existsSync(clientJsPath)) {
            return new Response(Bun.file(clientJsPath), {
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            });
          }
          return new Response(
            'console.warn("[HMR] client.js not built yet...");',
            {
              headers: { "Content-Type": "application/javascript" },
            },
          );
        })
        .get("/public/styles.css", () => {
          if (existsSync(stylesCssPath)) {
            return new Response(Bun.file(stylesCssPath), {
              headers: {
                "Content-Type": "text/css",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            });
          }
          return new Response("/* CSS not built yet */", {
            headers: { "Content-Type": "text/css" },
          });
        });
    } else {
      // PRODUCTION: Serve from embedded assets
      this.elysia
        .get(
          "/public/client.js",
          () =>
            new Response(clientJs, {
              headers: { "Content-Type": "application/javascript" },
            }),
        )
        .get(
          "/public/styles.css",
          () =>
            new Response(stylesCss, {
              headers: { "Content-Type": "text/css" },
            }),
        );
    }
    return this;
  }

  /**
   * Registers an array of feature modules dynamically.
   */
  public registerModules(modules: AppModule[]): this {
    modules.forEach((mod) => {
      this.elysia.use(mod.plugin);
      console.log(`[MODULE] Loaded: ${mod.name}`);
    });
    return this;
  }

  /**
   * Sets up the catch-all route for SSR with React.
   * In dev mode, injects HMR client script.
   */
  public registerSSR(): this {
    this.elysia.get("/*", async ({ request }) => {
      try {
        const stream = await renderToReadableStream(
          createElement(WebApp, { url: request.url }),
        );
        const content = await Bun.readableStreamToText(stream);

        // Inject HMR client script in dev mode
        const hmrScript = isDev
          ? `<script>${generateHMRClientScript(hmrPort)}</script>`
          : "";

        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Minimo Framework</title>
            <link rel="stylesheet" href="/public/styles.css" />
          </head>
          <body>
            <div id="root">${content}</div>
            <script type="module" src="/public/client.js"></script>
            ${hmrScript}
          </body>
          </html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      } catch (error) {
        console.error("[SSR ERROR]", error);
        return new Response(
          "<h1>500 Internal Server Error (SSR Failed)</h1><pre>" +
            (error as Error).stack +
            "</pre>",
          {
            status: 500,
            headers: { "Content-Type": "text/html" },
          },
        );
      }
    });
    return this;
  }

  /**
   * Starts the HTTP server.
   */
  public start(): void {
    this.elysia.listen(this.port, () => {
      console.log(
        `\n🚀 [SYS] Server is running on http://localhost:${this.port}\n`,
      );
      if (isDev) {
        console.log(`🔥 [HMR] Dev mode active (ws://localhost:${hmrPort})\n`);
      }
    });
  }
}
