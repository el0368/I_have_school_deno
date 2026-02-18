// Sovereign Academy - Native Frameless Window with WebView (Deno FFI)
//
// This library creates a frameless (borderless) native window with
// an embedded webview that loads the Fresh server (localhost:8000).
// The custom title bar is rendered by Preact inside the webview.

use std::ffi::c_void;
use std::sync::Mutex;
use tao::{
    dpi::PhysicalSize,
    event_loop::EventLoop,
    window::{Window, WindowBuilder},
};
use wry::WebViewBuilder;

// Wrapper to mark the raw pointer as thread-safe for global storage.
// Safety: All access to the window is protected by the Mutex.
struct SendPtr(*mut Window);
unsafe impl Send for SendPtr {}

// Global window handle for FFI access
static WINDOW: Mutex<Option<SendPtr>> = Mutex::new(None);

/// Create a frameless window with embedded webview.
/// The webview loads http://localhost:8000 (Fresh server).
/// Returns a raw pointer to the window handle.
///
/// # Safety
/// Called from Deno FFI. The pointer must be managed by the caller.
#[no_mangle]
pub extern "C" fn create_frameless_window(width: i32, height: i32) -> *mut c_void {
    let event_loop = EventLoop::new();

    let window = WindowBuilder::new()
        .with_title("Sovereign Academy")
        .with_inner_size(PhysicalSize::new(width as u32, height as u32))
        .with_decorations(false) // FRAMELESS - no system title bar
        .with_resizable(true)
        .build(&event_loop)
        .expect("Failed to create window");

    // Create webview inside the window
    let _webview = WebViewBuilder::new(&window)
        .unwrap()
        .with_url("http://localhost:8000")
        .unwrap()
        .build()
        .expect("Failed to create webview");

    // Note: WebView must be kept alive - in production, store it alongside window
    // For now, we leak it intentionally to keep it alive
    std::mem::forget(_webview);

    let window_ptr = Box::into_raw(Box::new(window));

    // Store globally for minimize/maximize/close access
    if let Ok(mut guard) = WINDOW.lock() {
        *guard = Some(SendPtr(window_ptr));
    }

    window_ptr as *mut c_void
}

/// Minimize the window to taskbar.
#[no_mangle]
pub extern "C" fn minimize_window() {
    if let Ok(guard) = WINDOW.lock() {
        if let Some(ref sp) = *guard {
            unsafe {
                let window = &*sp.0;
                window.set_minimized(true);
            }
        }
    }
}

/// Toggle maximize/restore for the window.
#[no_mangle]
pub extern "C" fn maximize_window() {
    if let Ok(guard) = WINDOW.lock() {
        if let Some(ref sp) = *guard {
            unsafe {
                let window = &*sp.0;
                let is_maximized = window.is_maximized();
                window.set_maximized(!is_maximized);
            }
        }
    }
}

/// Close and destroy the window.
#[no_mangle]
pub extern "C" fn close_window() {
    if let Ok(mut guard) = WINDOW.lock() {
        if let Some(sp) = guard.take() {
            unsafe {
                let _ = Box::from_raw(sp.0);
            }
        }
    }
}

/// Set the window title from a UTF-8 C string.
#[no_mangle]
pub extern "C" fn set_window_title(title_ptr: *const u8, title_len: u32) {
    if let Ok(guard) = WINDOW.lock() {
        if let Some(ref sp) = *guard {
            unsafe {
                let slice = std::slice::from_raw_parts(title_ptr, title_len as usize);
                if let Ok(title) = std::str::from_utf8(slice) {
                    let window = &*sp.0;
                    window.set_title(title);
                }
            }
        }
    }
}

/// Resize the window.
#[no_mangle]
pub extern "C" fn set_window_size(width: i32, height: i32) {
    if let Ok(guard) = WINDOW.lock() {
        if let Some(ref sp) = *guard {
            unsafe {
                let window = &*sp.0;
                let _ = window.set_inner_size(PhysicalSize::new(width as u32, height as u32));
            }
        }
    }
}

/// Check if window is currently maximized.
/// Returns 1 if maximized, 0 if not.
#[no_mangle]
pub extern "C" fn is_maximized() -> i32 {
    if let Ok(guard) = WINDOW.lock() {
        if let Some(ref sp) = *guard {
            unsafe {
                let window = &*sp.0;
                return if window.is_maximized() { 1 } else { 0 };
            }
        }
    }
    0
}
