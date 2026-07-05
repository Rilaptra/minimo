// apps/api/src/hmr/types.ts

/**
 * Type definitions for the custom HMR system.
 */

export type HMRMessageType =
  | "connected"
  | "building"
  | "full-reload"
  | "css-update"
  | "error";

export interface HMRMessage {
  data?: string;
  file?: string;
  timestamp: number;
  type: HMRMessageType;
}

export type FileCategory = "backend" | "frontend" | "shared";

export interface WatchPath {
  category: FileCategory;
  ignore?: RegExp[];
  path: string;
}

export interface HMRConfig {
  debounceMs: number;
  hmrPort: number;
  serverPort: number;
  watchPaths: WatchPath[];
}
