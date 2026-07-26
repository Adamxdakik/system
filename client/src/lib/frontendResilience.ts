export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STALE_CHUNK_PATTERNS = [
  /chunkloaderror/i,
  /loading chunk [\d-]+ failed/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /failed to load module script/i,
];

export const STALE_CHUNK_RELOAD_KEY = "app:stale-chunk-reload";
export const STALE_CHUNK_RELOAD_WINDOW_MS = 60_000;

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function isStaleChunkError(error: unknown): boolean {
  const message = errorMessage(error);
  return STALE_CHUNK_PATTERNS.some((pattern) => pattern.test(message));
}

export function shouldReloadForStaleChunk(
  error: unknown,
  storage: StorageLike | undefined,
  now = Date.now(),
): boolean {
  if (!isStaleChunkError(error) || !storage) return false;

  try {
    const previous = Number(storage.getItem(STALE_CHUNK_RELOAD_KEY));
    if (Number.isFinite(previous) && now - previous < STALE_CHUNK_RELOAD_WINDOW_MS) {
      return false;
    }

    storage.setItem(STALE_CHUNK_RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

export function clearExpiredStaleChunkReloadGuard(
  storage: StorageLike | undefined,
  now = Date.now(),
): void {
  if (!storage) return;

  try {
    const previous = Number(storage.getItem(STALE_CHUNK_RELOAD_KEY));
    if (!Number.isFinite(previous) || now - previous >= STALE_CHUNK_RELOAD_WINDOW_MS) {
      storage.removeItem(STALE_CHUNK_RELOAD_KEY);
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
