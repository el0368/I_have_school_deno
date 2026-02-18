// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — Exercise Loader Unit Tests (Vitest)
// ═══════════════════════════════════════════════════════════════════
//
// Tests for lib/exercise-loader.ts: MessagePack parsing, demo generation,
// and cache management.
// ═══════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCache,
  generateDemoExercise,
  getCacheStats,
  parseExercise,
  setMsgpackDecoder,
} from "./exercise-loader.ts";

// ─── Inject a JSON-based stub decoder ────────────────────────────────
// This avoids any reference to @msgpack/msgpack at transform time.
// The stub simply JSON-parses the buffer (our test helper encodes to JSON).

beforeEach(() => {
  setMsgpackDecoder((data: Uint8Array): unknown => {
    const text = new TextDecoder().decode(data);
    return JSON.parse(text);
  });
  clearCache();
  vi.clearAllMocks();
});

// ─── MessagePack Parsing ─────────────────────────────────────────────

describe("parseExercise", () => {
  /**
   * Build a mock MessagePack buffer by JSON-encoding the exercise object.
   * The vi.mock above will decode it back via JSON.parse.
   */
  function buildMsgPack(
    type: string,
    problem: string,
    answer: string,
    id?: number,
  ): Uint8Array {
    const obj: Record<string, unknown> = { type, problem, expectedAnswer: answer };
    if (id !== undefined) obj.id = id;
    return new TextEncoder().encode(JSON.stringify(obj));
  }

  it("parses arithmetic exercise", async () => {
    const bin = buildMsgPack("arithmetic", "2 + 3", "5");
    const ex = await parseExercise(bin, 1);

    expect(ex.id).toBe(1);
    expect(ex.type).toBe("arithmetic");
    expect(ex.problem).toBe("2 + 3");
    expect(ex.expectedAnswer).toBe("5");
  });

  it("parses fraction exercise", async () => {
    const bin = buildMsgPack("fraction", "Simplify: 4/8", "1/2");
    const ex = await parseExercise(bin, 42);

    expect(ex.id).toBe(42);
    expect(ex.type).toBe("fraction");
    expect(ex.problem).toBe("Simplify: 4/8");
    expect(ex.expectedAnswer).toBe("1/2");
  });

  it("parses equation exercise", async () => {
    const bin = buildMsgPack("equation", "x + 3 = 7", "4");
    const ex = await parseExercise(bin, 99);

    expect(ex.id).toBe(99);
    expect(ex.type).toBe("equation");
    expect(ex.problem).toBe("x + 3 = 7");
    expect(ex.expectedAnswer).toBe("4");
  });

  it("uses id from binary data if present", async () => {
    const bin = buildMsgPack("arithmetic", "1 + 1", "2", 77);
    const ex = await parseExercise(bin, 1);
    expect(ex.id).toBe(77);
  });

  it("falls back to provided id when binary id is absent", async () => {
    const bin = buildMsgPack("arithmetic", "3 + 3", "6");
    const ex = await parseExercise(bin, 55);
    expect(ex.id).toBe(55);
  });

  it("throws on invalid exercise data", async () => {
    const bad = new TextEncoder().encode(JSON.stringify({ foo: "bar" }));
    await expect(parseExercise(bad, 1)).rejects.toThrow();
  });

  it("parsing is deterministic (100 iterations)", async () => {
    const bin = buildMsgPack("arithmetic", "7 * 8", "56");
    for (let i = 0; i < 100; i++) {
      const ex = await parseExercise(bin, 1);
      expect(ex.type).toBe("arithmetic");
      expect(ex.problem).toBe("7 * 8");
      expect(ex.expectedAnswer).toBe("56");
    }
  });
});

// ─── Demo Exercise Generator ─────────────────────────────────────────

describe("generateDemoExercise", () => {
  it("returns a valid exercise object", () => {
    const ex = generateDemoExercise(1, 0);

    expect(ex.id).toBe(1);
    expect(["arithmetic", "fraction"]).toContain(ex.type);
    expect(ex.problem).toBeTypeOf("string");
    expect(ex.problem.length).toBeGreaterThan(0);
    expect(ex.expectedAnswer).toBeTypeOf("string");
  });

  it("exercise ID is exerciseIdx + 1", () => {
    expect(generateDemoExercise(1, 0).id).toBe(1);
    expect(generateDemoExercise(1, 5).id).toBe(6);
    expect(generateDemoExercise(1, 99).id).toBe(100);
  });

  it("generates arithmetic exercises for low topic IDs", () => {
    // Topics 1-5 map to arithmetic (mod types.length)
    for (let i = 0; i < 10; i++) {
      const ex = generateDemoExercise(1, i);
      expect(ex.type).toBe("arithmetic");
    }
  });

  it("generates fraction exercises for topic ID 6", () => {
    // Topic 6 mod 10 = 6, maps to fraction type
    for (let i = 0; i < 10; i++) {
      const ex = generateDemoExercise(6, i);
      expect(ex.type).toBe("fraction");
    }
  });

  it("arithmetic problems contain an operator", () => {
    const ex = generateDemoExercise(1, 0);
    if (ex.type === "arithmetic") {
      expect(ex.problem).toMatch(/\d+\s+[+\-*]\s+\d+/);
    }
  });

  it("arithmetic answers are correct computations", () => {
    // Generate many and verify each
    for (let i = 0; i < 50; i++) {
      const ex = generateDemoExercise(2, i);
      if (ex.type === "arithmetic") {
        const parts = ex.problem.split(/\s+/);
        const a = Number(parts[0]);
        const op = parts[1];
        const b = Number(parts[2]);
        let expected: number;

        switch (op) {
          case "+":
            expected = a + b;
            break;
          case "-":
            expected = a - b;
            break;
          case "*":
            expected = a * b;
            break;
          default:
            expected = a + b;
        }

        expect(Number(ex.expectedAnswer)).toBe(expected);
      }
    }
  });

  it("fraction problems follow 'Simplify: N/D' pattern", () => {
    const ex = generateDemoExercise(6, 0);
    if (ex.type === "fraction") {
      expect(ex.problem).toMatch(/^Simplify: \d+\/\d+$/);
    }
  });

  it("is fully deterministic (same inputs → same output, 100 iterations)", () => {
    const reference = generateDemoExercise(3, 7);
    for (let i = 0; i < 100; i++) {
      const ex = generateDemoExercise(3, 7);
      expect(ex.problem).toBe(reference.problem);
      expect(ex.expectedAnswer).toBe(reference.expectedAnswer);
      expect(ex.type).toBe(reference.type);
      expect(ex.id).toBe(reference.id);
    }
  });

  it("produces different exercises for different inputs", () => {
    const ex1 = generateDemoExercise(1, 0);
    const ex2 = generateDemoExercise(1, 1);
    const ex3 = generateDemoExercise(2, 0);
    // At least one pair should differ (extremely likely with different seeds)
    const allSame = ex1.problem === ex2.problem && ex2.problem === ex3.problem;
    expect(allSame).toBe(false);
  });
});

// ─── Cache Management ────────────────────────────────────────────────

describe("cache", () => {
  it("starts empty after clearCache()", () => {
    const stats = getCacheStats();
    expect(stats.entries).toBe(0);
    expect(stats.approximateBytes).toBe(0);
  });

  it("clearCache() resets everything", () => {
    // We can't easily populate the fetch-based cache in unit tests,
    // but clearCache should not throw and should return clean stats.
    clearCache();
    const stats = getCacheStats();
    expect(stats.entries).toBe(0);
    expect(stats.approximateBytes).toBe(0);
  });
});
