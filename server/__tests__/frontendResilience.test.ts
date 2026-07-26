import { describe, expect, it } from "vitest";
import {
  clearExpiredStaleChunkReloadGuard,
  isStaleChunkError,
  shouldReloadForStaleChunk,
  STALE_CHUNK_RELOAD_KEY,
  STALE_CHUNK_RELOAD_WINDOW_MS,
  type StorageLike,
} from "../../client/src/lib/frontendResilience";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("frontend resilience", () => {
  it("recognizes stale deployment chunk failures", () => {
    expect(isStaleChunkError(new Error("Failed to fetch dynamically imported module"))).toBe(true);
    expect(isStaleChunkError(new Error("Loading chunk 42 failed"))).toBe(true);
    expect(isStaleChunkError(new Error("Regular rendering failure"))).toBe(false);
  });

  it("allows one automatic reload inside the guard window", () => {
    const storage = new MemoryStorage();
    const error = new Error("ChunkLoadError: Loading chunk 9 failed");

    expect(shouldReloadForStaleChunk(error, storage, 1_000)).toBe(true);
    expect(shouldReloadForStaleChunk(error, storage, 1_001)).toBe(false);
    expect(
      shouldReloadForStaleChunk(error, storage, 1_000 + STALE_CHUNK_RELOAD_WINDOW_MS),
    ).toBe(true);
  });

  it("clears only expired or invalid reload guards", () => {
    const storage = new MemoryStorage();
    storage.setItem(STALE_CHUNK_RELOAD_KEY, "1000");

    clearExpiredStaleChunkReloadGuard(storage, 1_500);
    expect(storage.getItem(STALE_CHUNK_RELOAD_KEY)).toBe("1000");

    clearExpiredStaleChunkReloadGuard(storage, 1_000 + STALE_CHUNK_RELOAD_WINDOW_MS);
    expect(storage.getItem(STALE_CHUNK_RELOAD_KEY)).toBeNull();
  });
});
