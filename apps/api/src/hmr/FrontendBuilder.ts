// apps/api/src/hmr/FrontendBuilder.ts

import { existsSync } from "node:fs";
import { join } from "node:path";

export interface BuildResult {
  duration: number;
  errors: string[];
  success: boolean;
}

/**
 * Membangun ulang frontend (client.js & styles.css) saat file berubah.
 * Menggunakan konfigurasi dev-friendly: no minify, inline sourcemaps.
 */
export class FrontendBuilder {
  private webDistDir: string;
  private clientEntry: string;
  private cssEntry: string;
  private clientOut: string;
  private cssOut: string;

  constructor() {
    this.webDistDir = join(import.meta.dir, "../../../web/dist");
    this.clientEntry = join(import.meta.dir, "../../../web/src/client.tsx");
    this.cssEntry = join(
      import.meta.dir,
      "../../../web/src/styles/globals.css",
    );
    this.clientOut = join(this.webDistDir, "client.js");
    this.cssOut = join(this.webDistDir, "styles.css");
  }

  /**
   * Build JavaScript bundle menggunakan Bun.build().
   * Dev mode: no minify, inline sourcemaps untuk debugging.
   */
  async buildJS(): Promise<BuildResult> {
    const start = Date.now();

    if (!existsSync(this.clientEntry)) {
      return {
        success: false,
        errors: [`Entrypoint tidak ditemukan: ${this.clientEntry}`],
        duration: 0,
      };
    }

    const result = await Bun.build({
      entrypoints: [this.clientEntry],
      outdir: this.webDistDir,
      naming: "client.js",
      minify: false,
      target: "browser",
      format: "esm",
      sourcemap: "inline",
    });

    const duration = Date.now() - start;

    if (!result.success) {
      return {
        success: false,
        errors: result.logs.map((l) => String(l)),
        duration,
      };
    }

    return { success: true, errors: [], duration };
  }

  /**
   * Build CSS menggunakan Tailwind CLI.
   * Dev mode: tanpa --minify untuk build lebih cepat.
   */
  async buildCSS(): Promise<BuildResult> {
    const start = Date.now();

    if (!existsSync(this.cssEntry)) {
      return {
        success: false,
        errors: [`CSS entry tidak ditemukan: ${this.cssEntry}`],
        duration: 0,
      };
    }

    const proc = Bun.spawn(
      ["bunx", "@tailwindcss/cli", "-i", this.cssEntry, "-o", this.cssOut],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const exitCode = await proc.exited;
    const duration = Date.now() - start;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      return {
        success: false,
        errors: [stderr || `Tailwind CLI exit code: ${exitCode}`],
        duration,
      };
    }

    return { success: true, errors: [], duration };
  }

  /**
   * Build both JS dan CSS.
   */
  async buildAll(): Promise<BuildResult> {
    const cssResult = await this.buildCSS();
    if (!cssResult.success) return cssResult;

    const jsResult = await this.buildJS();
    return jsResult;
  }

  /**
   * Cek apakah file dist sudah ada.
   */
  hasDistFiles(): boolean {
    return existsSync(this.clientOut) && existsSync(this.cssOut);
  }
}
