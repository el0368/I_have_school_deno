// Sovereign Academy - Binary Exercise Loader
//
// Loads .bin exercise files from the server via streaming.
// Parses MessagePack format into Exercise objects.
// Validates decoded data with Zod before returning.
// Caches loaded exercises in memory for performance.

import type { Exercise } from "./state.ts";
import { safeParseExercise } from "./schemas.ts";

// ─── MessagePack decoder (injectable for tests) ───────────────────────
// Default decoder loads the real @msgpack/msgpack package lazily at runtime.
// Tests call setMsgpackDecoder() in beforeEach to inject a stub — this avoids
// any Vite transform-time resolution of the package (which may not be installed
// in CI / test environments).

type DecoderFn = (data: Uint8Array) => unknown;

let _decoder: DecoderFn | null = null;

async function msgpackDecode(data: Uint8Array): Promise<unknown> {
  if (_decoder) return _decoder(data);
  // Lazy-load via the sibling module (isolated so Vite test transforms
  // never touch the npm specifier — tests always call setMsgpackDecoder first).
  const { decode } = await import("./msgpack-loader.ts");
  return decode(data);
}

/** Replace the internal decoder — call this in test `beforeEach` / setup. */
export function setMsgpackDecoder(fn: DecoderFn | null): void {
  _decoder = fn;
}

// ─── Cache ───────────────────────────────────────────────────────────

const exerciseCache = new Map<string, Uint8Array>();

// ─── Manifest ────────────────────────────────────────────────────────

export interface ExerciseManifest {
  topics: TopicManifest[];
}

export interface TopicManifest {
  id: number;
  name: string;
  exercises: string[]; // paths to .bin files
}

let cachedManifest: ExerciseManifest | null = null;

/** Load the exercise manifest from the server. */
export async function loadManifest(): Promise<ExerciseManifest> {
  if (cachedManifest) return cachedManifest;

  const response = await fetch("/api/manifest");
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.status}`);
  }

  cachedManifest = await response.json();
  return cachedManifest!;
}

// ─── Binary Loading ──────────────────────────────────────────────────

/** Load a binary exercise file from the server.
 *  Returns raw Uint8Array bytes.
 *  Uses cache to avoid duplicate fetches.
 */
export async function loadExerciseBinary(path: string): Promise<Uint8Array> {
  // Check cache
  const cached = exerciseCache.get(path);
  if (cached) return cached;

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load exercise: ${path} (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Cache for future access
  exerciseCache.set(path, bytes);

  return bytes;
}

// ─── Binary Parsing ──────────────────────────────────────────────────

/**
 * Parse a MessagePack-encoded exercise file into a validated Exercise object.
 *
 * MessagePack format (replaces old manual u8/u16 binary format):
 *   The .bin file is a MessagePack-encoded map with keys:
 *     id: number            (optional — falls back to the provided id arg)
 *     type: "arithmetic" | "fraction" | "equation"
 *     problem: string
 *     expectedAnswer: string
 *
 * Zod validates the decoded object before it touches the UI.
 */
export async function parseExercise(data: Uint8Array, id: number): Promise<Exercise> {
  const raw = await msgpackDecode(data);

  // Inject id if not present in the binary (legacy files may omit it)
  const withId = raw !== null &&
      typeof raw === "object" &&
      typeof (raw as Record<string, unknown>).id === "number"
    ? raw
    : { ...(raw as Record<string, unknown>), id };

  const validated = safeParseExercise(withId);
  if (!validated) {
    throw new Error(`Invalid exercise data for id=${id}: ${JSON.stringify(raw)}`);
  }

  return validated;
}

// ─── High-Level API ──────────────────────────────────────────────────

/** Load and parse a specific exercise for a topic. */
export async function loadExercise(
  topicId: number,
  exerciseIdx: number,
): Promise<Exercise> {
  const paddedTopic = String(topicId).padStart(2, "0");
  const paddedExercise = String(exerciseIdx + 1).padStart(3, "0");
  const path = `/exercises/topic-${paddedTopic}/exercise-${paddedExercise}.bin`;

  const data = await loadExerciseBinary(path);
  return parseExercise(data, exerciseIdx + 1);
}

// ─── Deterministic PRNG ──────────────────────────────────────────────

/**
 * Simple seeded PRNG (mulberry32).
 * Deterministic: same seed → same sequence, every time.
 * Used ONLY by generateDemoExercise (dev fallback).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a deterministic demo exercise (for development when .bin files aren't ready).
 *
 * Uses a seeded PRNG derived from (topicId, exerciseIdx) so that the
 * same inputs always produce the same exercise. NO Math.random().
 */
export function generateDemoExercise(
  topicId: number,
  exerciseIdx: number,
): Exercise {
  const seed = topicId * 10_000 + exerciseIdx;
  const rng = mulberry32(seed);

  const types = [
    "arithmetic",
    "arithmetic",
    "arithmetic",
    "arithmetic",
    "arithmetic",
    "fraction",
    "fraction",
    "fraction",
    "fraction",
    "fraction",
  ];
  const type = types[topicId % types.length];

  if (type === "arithmetic") {
    const a = Math.floor(rng() * 20) + 1;
    const b = Math.floor(rng() * 20) + 1;
    const ops = ["+", "-", "*"];
    const op = ops[exerciseIdx % ops.length];
    let answer: number;
    switch (op) {
      case "+":
        answer = a + b;
        break;
      case "-":
        answer = a - b;
        break;
      case "*":
        answer = a * b;
        break;
      default:
        answer = a + b;
    }
    return {
      id: exerciseIdx + 1,
      type: "arithmetic",
      problem: `${a} ${op} ${b}`,
      expectedAnswer: String(answer),
    };
  }

  // Fraction
  const num = Math.floor(rng() * 10) + 1;
  const den = Math.floor(rng() * 10) + 2;
  return {
    id: exerciseIdx + 1,
    type: "fraction",
    problem: `Simplify: ${num * 2}/${den * 2}`,
    expectedAnswer: `${num}/${den}`,
  };
}

/** Clear the exercise cache. */
export function clearCache(): void {
  exerciseCache.clear();
  cachedManifest = null;
}

/** Get cache statistics. */
export function getCacheStats(): { entries: number; approximateBytes: number } {
  let totalBytes = 0;
  for (const data of exerciseCache.values()) {
    totalBytes += data.byteLength;
  }
  return {
    entries: exerciseCache.size,
    approximateBytes: totalBytes,
  };
}
