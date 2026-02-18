// Sovereign Academy - Deno FFI Bridge to Rust Native Window
//
// This module loads the compiled Rust dynamic library and exposes
// window management functions to the Fresh application.
//
// Usage:
//   import { NativeWindow } from "../lib/native.ts";
//   NativeWindow.create(1280, 720);
//   NativeWindow.minimize();

const LIB_SUFFIX: Record<string, string> = {
  windows: "dll",
  darwin: "dylib",
  linux: "so",
};

const suffix = LIB_SUFFIX[Deno.build.os] ?? "so";
const libPath = `./native/target/release/native_window.${suffix}`;

let lib: Deno.DynamicLibrary<typeof symbols> | null = null;

const symbols = {
  create_frameless_window: {
    parameters: ["i32", "i32"],
    result: "pointer",
  },
  minimize_window: {
    parameters: [],
    result: "void",
  },
  maximize_window: {
    parameters: [],
    result: "void",
  },
  close_window: {
    parameters: [],
    result: "void",
  },
  set_window_title: {
    parameters: ["buffer", "u32"],
    result: "void",
  },
  set_window_size: {
    parameters: ["i32", "i32"],
    result: "void",
  },
  is_maximized: {
    parameters: [],
    result: "i32",
  },
} as const;

function loadLibrary(): Deno.DynamicLibrary<typeof symbols> {
  if (!lib) {
    try {
      lib = Deno.dlopen(libPath, symbols);
      console.log(`[Native] Loaded ${libPath}`);
    } catch (err) {
      console.warn(
        `[Native] Could not load native library: ${err}`,
      );
      console.warn(
        `[Native] Running in browser-only mode (no frameless window).`,
      );
      throw err;
    }
  }
  return lib;
}

export const NativeWindow = {
  /** Create a frameless window. Returns the window handle pointer. */
  create(width = 1280, height = 720): Deno.PointerObject | null {
    try {
      const nativeLib = loadLibrary();
      return nativeLib.symbols.create_frameless_window(width, height);
    } catch {
      return null;
    }
  },

  /** Minimize the window to the taskbar. */
  minimize(): void {
    try {
      loadLibrary().symbols.minimize_window();
    } catch {
      // Browser-only mode - no-op
    }
  },

  /** Toggle maximize/restore. */
  maximize(): void {
    try {
      loadLibrary().symbols.maximize_window();
    } catch {
      // Browser-only mode - no-op
    }
  },

  /** Close and destroy the window. */
  close(): void {
    try {
      loadLibrary().symbols.close_window();
    } catch {
      // Browser-only mode - no-op
    }
  },

  /** Set the window title. */
  setTitle(title: string): void {
    try {
      const encoder = new TextEncoder();
      const buf = encoder.encode(title);
      loadLibrary().symbols.set_window_title(buf, buf.length);
    } catch {
      // Browser-only mode - no-op
    }
  },

  /** Resize the window. */
  setSize(width: number, height: number): void {
    try {
      loadLibrary().symbols.set_window_size(width, height);
    } catch {
      // Browser-only mode - no-op
    }
  },

  /** Check if the window is maximized. */
  isMaximized(): boolean {
    try {
      return loadLibrary().symbols.is_maximized() === 1;
    } catch {
      return false;
    }
  },

  /** Cleanup: unload the library. */
  destroy(): void {
    if (lib) {
      lib.close();
      lib = null;
    }
  },
};
