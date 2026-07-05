// apps/api/src/hmr/FileWatcher.ts

import { existsSync, type FSWatcher, watch } from "node:fs";
import type { FileCategory, WatchPath } from "./types";

export interface FileChangeEvent {
  category: FileCategory;
  event: string;
  filename: string;
}

/**
 * File system watcher dengan debouncing.
 * Memantau perubahan file dan mengelompokkan event yang berdekatan
 * untuk menghindari multiple trigger.
 */
export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private debounceTimer: Timer | null = null;
  private pendingEvents: FileChangeEvent[] = [];

  constructor(
    private watchPaths: WatchPath[],
    private onChange: (events: FileChangeEvent[]) => void,
    private debounceMs: number = 150,
  ) {}

  /**
   * Memulai memantau semua path yang terdaftar.
   */
  start(): void {
    for (const wp of this.watchPaths) {
      if (!existsSync(wp.path)) {
        console.warn(`  [HMR] ⚠️  Watch path tidak ditemukan: ${wp.path}`);
        continue;
      }

      try {
        const watcher = watch(
          wp.path,
          { recursive: true },
          (event, filename) => {
            if (!filename) return;

            // Cek ignore patterns
            if (wp.ignore) {
              for (const pattern of wp.ignore) {
                if (pattern.test(filename)) return;
              }
            }

            this.pendingEvents.push({
              category: wp.category,
              filename: filename.replace(/\\/g, "/"),
              event,
            });
            this.debounce();
          },
        );
        this.watchers.push(watcher);
      } catch (err) {
        console.error(`  [HMR] ❌ Gagal watch ${wp.path}:`, err);
      }
    }
    console.log(`  [HMR] 👀 Memantau ${this.watchers.length} direktori...`);
  }

  /**
   * Debounce event untuk menggabungkan perubahan yang berdekatan.
   */
  private debounce(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const events = [...this.pendingEvents];
      this.pendingEvents = [];
      this.debounceTimer = null;
      if (events.length > 0) {
        this.onChange(events);
      }
    }, this.debounceMs);
  }

  /**
   * Menghentikan semua watcher.
   */
  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    for (const w of this.watchers) {
      try {
        w.close();
      } catch {}
    }
    this.watchers = [];
  }
}
