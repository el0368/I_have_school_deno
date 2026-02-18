// Sovereign Academy — WASM Loader (Phase 6.8)
//
// Extracted from islands/MathStage.tsx.
// Handles WASM math engine initialization via dynamic import,
// runs the health check, and exposes the module as a signal.

import { signal } from "@preact/signals";
import {
  formatHealthCheckReport,
  type HealthCheckResult,
  runHealthCheck,
} from "./wasm-health-check.ts";
import type { MathWasm } from "./types.ts";

// ─── Module State (signals) ──────────────────────────────────────────

/** Whether the WASM engine is loaded (pass or fail). */
export const wasmReady = signal<boolean>(false);

/** Reference to the loaded WASM module (null until loaded). */
export const wasmModule = signal<MathWasm | null>(null);

/** Result of the startup health check. */
export const healthStatus = signal<HealthCheckResult | null>(null);

// ─── Initialization ──────────────────────────────────────────────────

/**
 * Load the WASM math engine via fetch + blob URL.
 *
 * Uses dynamic import with blob URL to avoid Vite build-time analysis.
 * Runs the Phase 6.2 health check after loading.
 *
 * Safe to call multiple times — subsequent calls are no-ops if already loaded.
 */
export async function initWasm(): Promise<void> {
  // Already loaded — skip
  if (wasmModule.value) return;

  try {
    const jsResponse = await fetch("/wasm/math_validator.js");
    const jsText = await jsResponse.text();
    const blob = new Blob([jsText], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    const module = await import(/* @vite-ignore */ blobUrl);
    URL.revokeObjectURL(blobUrl);

    await module.default("/wasm/math_validator_bg.wasm");
    const wasmRef = module as unknown as MathWasm;

    // ── Phase 6.2: WASM Health Check ──
    const health = runHealthCheck(wasmRef);
    healthStatus.value = health;
    console.log(formatHealthCheckReport(health));

    if (!health.passed) {
      console.error("[WASM] Health check FAILED — math engine may have drifted!");
    } else {
      console.log("[WASM] Math engine loaded + health check passed ✅");
    }

    wasmModule.value = wasmRef;
    wasmReady.value = true;
  } catch (err) {
    console.warn("[WASM] Could not load math engine, using JS fallback:", err);
    wasmReady.value = false;
  }
}
