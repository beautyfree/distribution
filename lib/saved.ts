"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ApiNode } from "./api-types";

export type SavedEntry = {
  node: ApiNode;
  savedAt: string;
  posted: boolean;
  postedAt?: string;
};

const STORAGE_KEY = "dist_saved_v1";
const STORAGE_EVENT = "dist:saved-changed";

let memo: SavedEntry[] | null = null;
const listeners = new Set<() => void>();

function read(): SavedEntry[] {
  if (typeof window === "undefined") return [];
  if (memo) return memo;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memo = [];
      return memo;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      memo = [];
      return memo;
    }
    memo = parsed.filter(
      (e): e is SavedEntry =>
        e &&
        typeof e === "object" &&
        e.node &&
        typeof e.node.id === "string" &&
        typeof e.savedAt === "string" &&
        typeof e.posted === "boolean",
    );
    return memo;
  } catch {
    memo = [];
    return memo;
  }
}

function write(next: SavedEntry[]) {
  memo = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota exceeded — best effort */
  }
  for (const fn of listeners) fn();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

const EMPTY: SavedEntry[] = [];

export function useSaved(): SavedEntry[] {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  );

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      memo = null;
      for (const fn of listeners) fn();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return snapshot;
}

export function isSaved(nodeId: string, list: SavedEntry[]): SavedEntry | null {
  return list.find((e) => e.node.id === nodeId) ?? null;
}

export function toggleSaved(node: ApiNode) {
  const list = read();
  const idx = list.findIndex((e) => e.node.id === node.id);
  if (idx >= 0) {
    write(list.filter((_, i) => i !== idx));
  } else {
    write([
      { node, savedAt: new Date().toISOString(), posted: false },
      ...list,
    ]);
  }
}

export function togglePosted(nodeId: string) {
  const list = read();
  const next = list.map((e) =>
    e.node.id === nodeId
      ? {
          ...e,
          posted: !e.posted,
          postedAt: !e.posted ? new Date().toISOString() : undefined,
        }
      : e,
  );
  write(next);
}

export function clearSaved() {
  write([]);
}

export function savedCounts(list: SavedEntry[]): {
  saved: number;
  posted: number;
  remaining: number;
} {
  const saved = list.length;
  const posted = list.filter((e) => e.posted).length;
  return { saved, posted, remaining: saved - posted };
}
