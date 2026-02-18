// ╔═══════════════════════════════════════════════════════════════════╗
// ║  FROZEN CORE — DO NOT MODIFY                                     ║
// ║                                                                   ║
// ║  Sovereign Academy – Desktop Launcher                             ║
// ║  Status:  AUDITED & VERIFIED (Phase 6.1) — 0 warnings            ║
// ║  Frozen:  2026-02-18  |  Audit: Phase 1 + Phase 6.1 complete     ║
// ║                                                                   ║
// ║  Any change requires:                                             ║
// ║    1. Explicit user approval                                      ║
// ║    2. Full regression test plan (drag, resize, min/max/close)     ║
// ║    3. 0 warnings after change (cargo build --release)             ║
// ║    4. Update CHANGELOG.md with reason for modification            ║
// ╚═══════════════════════════════════════════════════════════════════╝
//
// Discord-quality frameless native window with embedded WebView2.
// Uses Win32 DWM APIs for proper frameless behavior:
//   - DwmExtendFrameIntoClientArea → DWM shadow + composition
//   - WM_NCCALCSIZE → entire window is client area
//   - WM_NCHITTEST  → custom drag/resize hit-testing
//
// All UI logic lives in the Fresh app (Preact + Signals).
//
// Usage:  cargo run            (from desktop/)
//    or:  deno task launch:desktop   (from project root)

use std::process::{Child, Command};
use std::sync::atomic::{AtomicIsize, Ordering};
use std::thread;
use std::time::Duration;
use tao::{
    dpi::PhysicalSize,
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder},
    window::WindowBuilder,
};
use wry::WebViewBuilder;

/// Title bar height in physical pixels (matches the CSS drag bar).
const TITLEBAR_HEIGHT: i32 = 32;

/// Resize border width in physical pixels.
/// Matches Windows SM_CXFRAME + SM_CXPADDEDBORDER (~8px at 100% DPI).
const RESIZE_BORDER: i32 = 8;

// ═════════════════════════════════════════════════════════════════
//  Raw Win32 FFI declarations (avoids windows-sys version conflicts)
// ═════════════════════════════════════════════════════════════════
#[cfg(target_os = "windows")]
mod win32 {
    pub type HWND = isize;
    pub type HBRUSH = isize;
    pub type LRESULT = isize;
    pub type WPARAM = usize;
    pub type LPARAM = isize;

    #[repr(C)]
    #[derive(Copy, Clone)]
    pub struct RECT {
        pub left: i32,
        pub top: i32,
        pub right: i32,
        pub bottom: i32,
    }

    #[repr(C)]
    pub struct MARGINS {
        pub cx_left_width: i32,
        pub cx_right_width: i32,
        pub cy_top_height: i32,
        pub cy_bottom_height: i32,
    }

    // Window style constants
    pub const WS_CAPTION: u32 = 0x00C00000;
    pub const WS_THICKFRAME: u32 = 0x00040000;
    pub const WS_CLIPCHILDREN: u32 = 0x02000000;

    // GetWindowLongPtr / SetWindowLongPtr indices
    pub const GWL_STYLE: i32 = -16;
    pub const GWLP_WNDPROC: i32 = -4;

    // SetClassLongPtr indices
    pub const GCLP_HBRBACKGROUND: i32 = -10;

    // SetWindowPos flags
    pub const SWP_FRAMECHANGED: u32 = 0x0020;
    pub const SWP_NOMOVE: u32 = 0x0002;
    pub const SWP_NOSIZE: u32 = 0x0001;
    pub const SWP_NOZORDER: u32 = 0x0004;

    // Window messages
    pub const WM_NCCALCSIZE: u32 = 0x0083;
    pub const WM_NCHITTEST: u32 = 0x0084;
    pub const WM_ERASEBKGND: u32 = 0x0014;
    pub const WM_SIZE: u32 = 0x0005;

    // WM_NCHITTEST return values
    pub const HTCLIENT: isize = 1;
    pub const HTCAPTION: isize = 2;
    pub const HTLEFT: isize = 10;
    pub const HTRIGHT: isize = 11;
    pub const HTTOP: isize = 12;
    pub const HTTOPLEFT: isize = 13;
    pub const HTTOPRIGHT: isize = 14;
    pub const HTBOTTOM: isize = 15;
    pub const HTBOTTOMLEFT: isize = 16;
    pub const HTBOTTOMRIGHT: isize = 17;

    // WM_NCLBUTTONDOWN — used to initiate native resize from IPC
    pub const WM_NCLBUTTONDOWN: u32 = 0x00A1;

    extern "system" {
        // user32.dll
        pub fn GetWindowLongPtrW(hwnd: HWND, index: i32) -> isize;
        pub fn SetWindowLongPtrW(hwnd: HWND, index: i32, new_long: isize) -> isize;
        pub fn SetClassLongPtrW(hwnd: HWND, index: i32, new_long: isize) -> isize;
        pub fn SetWindowPos(
            hwnd: HWND, hwnd_after: HWND,
            x: i32, y: i32, cx: i32, cy: i32, flags: u32,
        ) -> i32;
        pub fn GetWindowRect(hwnd: HWND, rect: *mut RECT) -> i32;
        pub fn DefWindowProcW(hwnd: HWND, msg: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT;
        pub fn InvalidateRect(hwnd: HWND, rect: *const RECT, erase: i32) -> i32;
        pub fn ReleaseCapture() -> i32;
        pub fn SendMessageW(hwnd: HWND, msg: u32, wparam: WPARAM, lparam: LPARAM) -> LRESULT;
    }

    extern "system" {
        // gdi32.dll
        pub fn CreateSolidBrush(color: u32) -> HBRUSH;
    }

    #[link(name = "dwmapi")]
    extern "system" {
        // dwmapi.dll
        pub fn DwmExtendFrameIntoClientArea(hwnd: HWND, margins: *const MARGINS) -> i32;
    }
}

/// Stores the original WndProc so our subclass can forward messages.
/// Must be static because GWLP_USERDATA is used internally by tao.
#[cfg(target_os = "windows")]
static ORIGINAL_WNDPROC: AtomicIsize = AtomicIsize::new(0);

/// Custom events sent from webview IPC to the native event loop.
#[derive(Debug)]
enum UserEvent {
    Minimize,
    Maximize,
    Close,
    /// Initiate native resize drag. Value is the HT* direction constant.
    StartResize(isize),
}

fn main() -> wry::Result<()> {
    // ── 1. Start Fresh Vite dev server ───────────────────────────
    println!("[Desktop] Starting Fresh server...");
    let mut deno_server = start_fresh_server();

    thread::sleep(Duration::from_secs(2));
    wait_for_server(30);

    // ── 2. Create frameless window ───────────────────────────────
    println!("[Desktop] Creating frameless window...");

    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    let window = WindowBuilder::new()
        .with_title("Sovereign Academy")
        .with_inner_size(PhysicalSize::new(1280u32, 720u32))
        .with_decorations(false)
        .with_resizable(true)
        .build(&event_loop)
        .expect("Failed to create window");

    // ── 3. Win32: DWM frameless setup ────────────────────────────
    #[cfg(target_os = "windows")]
    {
        use tao::platform::windows::WindowExtWindows;
        let hwnd = window.hwnd() as isize;
        setup_frameless_window(hwnd);
    }

    // ── 4. Build WebView2 ────────────────────────────────────────
    let _webview = WebViewBuilder::new()
        .with_url("http://127.0.0.1:5173?desktop=1")
        .with_background_color((30, 31, 34, 255))
        .with_devtools(cfg!(debug_assertions))
        .with_initialization_script(
            r#"
            // Expose IPC to the Fresh app
            window.__DESKTOP__ = true;
            window.__ipc = {
                minimize: () => window.ipc.postMessage('minimize'),
                maximize: () => window.ipc.postMessage('maximize'),
                close:    () => window.ipc.postMessage('close'),
            };

            // ── Invisible resize handles at window edges ──
            // On mousedown, sends IPC to trigger native Win32 resize.
            // The native side calls ReleaseCapture + SendMessage(WM_NCLBUTTONDOWN)
            // so Windows takes over the resize loop (zero lag).
            (function() {
                function createResizeHandles() {
                    // Guard against double-creation
                    if (document.getElementById('__resize_top')) return;

                    var B = 8; // resize handle thickness in px (generous hit area)
                    var handles = [
                        ['top',         'ns-resize',   'top:0;left:'+B+'px;right:'+B+'px;height:'+B+'px'],
                        ['bottom',      'ns-resize',   'bottom:0;left:'+B+'px;right:'+B+'px;height:'+B+'px'],
                        ['left',        'ew-resize',   'left:0;top:'+B+'px;bottom:'+B+'px;width:'+B+'px'],
                        ['right',       'ew-resize',   'right:0;top:'+B+'px;bottom:'+B+'px;width:'+B+'px'],
                        ['topleft',     'nwse-resize', 'top:0;left:0;width:'+B+'px;height:'+B+'px'],
                        ['topright',    'nesw-resize', 'top:0;right:0;width:'+B+'px;height:'+B+'px'],
                        ['bottomleft',  'nesw-resize', 'bottom:0;left:0;width:'+B+'px;height:'+B+'px'],
                        ['bottomright', 'nwse-resize', 'bottom:0;right:0;width:'+B+'px;height:'+B+'px']
                    ];
                    handles.forEach(function(h) {
                        var el = document.createElement('div');
                        el.id = '__resize_' + h[0];
                        el.style.cssText = 'position:fixed;' + h[2]
                            + ';cursor:' + h[1]
                            + ';z-index:2147483647'           // max z-index
                            + ';pointer-events:auto'
                            + ';-webkit-app-region:no-drag'
                            + ';user-select:none'
                            + ';background:transparent;';
                        el.addEventListener('mousedown', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.ipc.postMessage('resize-' + h[0]);
                        });
                        document.body.appendChild(el);
                    });
                    console.log('[Desktop] Resize handles injected');
                }

                // Create handles once DOM body is ready
                if (document.body) {
                    createResizeHandles();
                } else {
                    document.addEventListener('DOMContentLoaded', createResizeHandles);
                }

                // Re-inject if a SPA navigation clears them (unlikely but safe)
                new MutationObserver(function() {
                    if (!document.getElementById('__resize_top') && document.body) {
                        createResizeHandles();
                    }
                }).observe(document.documentElement, { childList: true });
            })();
            "#,
        )
        .with_ipc_handler(move |req| {
            let msg = req.body();
            match msg.as_str() {
                "minimize" => { let _ = proxy.send_event(UserEvent::Minimize); }
                "maximize" => { let _ = proxy.send_event(UserEvent::Maximize); }
                "close"    => { let _ = proxy.send_event(UserEvent::Close); }
                _ if msg.starts_with("resize-") => {
                    let dir = match &msg[7..] {
                        "top"         => win32::HTTOP,
                        "bottom"      => win32::HTBOTTOM,
                        "left"        => win32::HTLEFT,
                        "right"       => win32::HTRIGHT,
                        "topleft"     => win32::HTTOPLEFT,
                        "topright"    => win32::HTTOPRIGHT,
                        "bottomleft"  => win32::HTBOTTOMLEFT,
                        "bottomright" => win32::HTBOTTOMRIGHT,
                        _ => return,
                    };
                    let _ = proxy.send_event(UserEvent::StartResize(dir));
                }
                _ => {}
            }
        })
        .build(&window)?;

    let size = window.inner_size();
    println!("[Desktop] ✓ Sovereign Academy is running");
    println!("[Desktop]   Window: {}×{} frameless", size.width, size.height);
    println!("[Desktop]   Server: http://127.0.0.1:5173");

    // ── 5. Event loop ────────────────────────────────────────────
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                println!("[Desktop] Closing…");
                let _ = deno_server.kill();
                *control_flow = ControlFlow::Exit;
            }
            Event::UserEvent(UserEvent::Minimize) => {
                window.set_minimized(true);
            }
            Event::UserEvent(UserEvent::Maximize) => {
                window.set_maximized(!window.is_maximized());
            }
            Event::UserEvent(UserEvent::Close) => {
                println!("[Desktop] Closing…");
                let _ = deno_server.kill();
                *control_flow = ControlFlow::Exit;
            }
            #[cfg(target_os = "windows")]
            Event::UserEvent(UserEvent::StartResize(direction)) => {
                // Initiate native Win32 resize — Windows takes over the
                // resize loop, so this is instant with zero IPC lag.
                use tao::platform::windows::WindowExtWindows;
                let hwnd = window.hwnd() as isize;
                unsafe {
                    win32::ReleaseCapture();
                    win32::SendMessageW(
                        hwnd,
                        win32::WM_NCLBUTTONDOWN,
                        direction as usize,
                        0,
                    );
                }
            }
            _ => {}
        }
    });
}

// ═════════════════════════════════════════════════════════════════
//  Win32 Frameless Window Setup
// ═════════════════════════════════════════════════════════════════
//
// This is the "Discord technique":
//   1. Remove WS_CAPTION but keep WS_THICKFRAME for native resize
//   2. DwmExtendFrameIntoClientArea(-1) for DWM shadow & composition
//   3. Subclass the WndProc to handle:
//      - WM_NCCALCSIZE: return 0 so entire window = client area
//      - WM_NCHITTEST:  custom hit-testing for drag bar + resize edges

#[cfg(target_os = "windows")]
fn setup_frameless_window(hwnd: isize) {
    use win32::*;

    unsafe {
        // Remove caption but keep thick frame + clip children (reduces flicker)
        let style = GetWindowLongPtrW(hwnd, GWL_STYLE);
        let new_style = (style & !(WS_CAPTION as isize))
            | (WS_THICKFRAME as isize)
            | (WS_CLIPCHILDREN as isize);
        SetWindowLongPtrW(hwnd, GWL_STYLE, new_style);

        // Extend DWM frame into entire client area → enables shadow + composition
        let margins = MARGINS {
            cx_left_width: -1,
            cx_right_width: -1,
            cy_top_height: -1,
            cy_bottom_height: -1,
        };
        DwmExtendFrameIntoClientArea(hwnd, &margins);

        // Paint background dark (#1e1f22 = 0x00221F1E in BGR COLORREF)
        let brush = CreateSolidBrush(0x0022_1F1E);
        SetClassLongPtrW(hwnd, GCLP_HBRBACKGROUND, brush);

        // Save original WndProc in a static (NOT GWLP_USERDATA — tao uses that)
        let original_proc = GetWindowLongPtrW(hwnd, GWLP_WNDPROC);
        ORIGINAL_WNDPROC.store(original_proc, Ordering::SeqCst);
        SetWindowLongPtrW(hwnd, GWLP_WNDPROC, custom_wndproc as isize);

        // Force Windows to recalculate the frame
        SetWindowPos(
            hwnd, 0, 0, 0, 0, 0,
            SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER,
        );

        InvalidateRect(hwnd, std::ptr::null(), 1);
    }

    println!("[Desktop] ✓ Win32 frameless setup complete (DWM + NCHITTEST)");
}

/// Custom WndProc for frameless hit-testing.
///
/// Handles:
/// - `WM_NCCALCSIZE` → returns 0 so entire window is client area
/// - `WM_NCHITTEST`  → returns HTCAPTION for drag bar, HT*LEFT/RIGHT/etc.
///   for resize edges, HTCLIENT for everything else
#[cfg(target_os = "windows")]
unsafe extern "system" fn custom_wndproc(
    hwnd: isize,
    msg: u32,
    wparam: usize,
    lparam: isize,
) -> isize {
    use win32::*;

    match msg {
        // ── WM_NCCALCSIZE: make entire window = client area ──
        WM_NCCALCSIZE => {
            if wparam != 0 {
                // Return 0, but set SWP_NOCOPYBITS in SetWindowPos logic (implicitly handled)
                // Returning 0 allows client area = window rect.
                //
                // The key to reducing lag is NOT necessarily WVR_VALIDRECTS, which can cause
                // artifacts if we don't supply correct rects.
                //
                // Instead, we rely on DwmExtendFrameIntoClientArea(-1) + WS_CLIPCHILDREN.
                // We also intentionally avoid DefWindowProc here because that adds borders/caption back.
                return 0;
            }
        }

        // ── WM_ERASEBKGND: dark fill immediately (no white flash) ──
        WM_ERASEBKGND => {
            // Background brush is already set on the class, so returning 1
            // tells Windows "I handled it" — it paints with our dark brush.
            return 1;
        }

        // ── WM_SIZE: standard resize handling ──
        WM_SIZE => {
            // Forward to original proc so tao/wry resize the WebView
            let original_proc = ORIGINAL_WNDPROC.load(Ordering::SeqCst);
            if original_proc != 0 {
                let proc_fn: unsafe extern "system" fn(isize, u32, usize, isize) -> isize =
                    std::mem::transmute(original_proc);
                return proc_fn(hwnd, msg, wparam, lparam);
            }
            return DefWindowProcW(hwnd, msg, wparam, lparam);
        }

        // ── WM_NCHITTEST: custom drag bar + resize edges ──
        WM_NCHITTEST => {
            // Cursor position in screen coords (packed in lparam)
            let cursor_x = (lparam & 0xFFFF) as i16 as i32;
            let cursor_y = ((lparam >> 16) & 0xFFFF) as i16 as i32;

            // Window rect in screen coords
            let mut rect = RECT {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
            GetWindowRect(hwnd, &mut rect);

            // Distance from each edge
            let left = cursor_x - rect.left;
            let right = rect.right - cursor_x;
            let top = cursor_y - rect.top;
            let bottom = rect.bottom - cursor_y;

            let border = RESIZE_BORDER;

            // Corners first (they overlap edges)
            if top <= border && left <= border {
                return HTTOPLEFT;
            }
            if top <= border && right <= border {
                return HTTOPRIGHT;
            }
            if bottom <= border && left <= border {
                return HTBOTTOMLEFT;
            }
            if bottom <= border && right <= border {
                return HTBOTTOMRIGHT;
            }

            // Edges
            if top <= border {
                return HTTOP;
            }
            if bottom <= border {
                return HTBOTTOM;
            }
            if left <= border {
                return HTLEFT;
            }
            if right <= border {
                return HTRIGHT;
            }

            // Title bar drag region (top TITLEBAR_HEIGHT pixels)
            if top <= TITLEBAR_HEIGHT {
                return HTCAPTION;
            }

            // Everything else = client area (WebView content)
            return HTCLIENT;
        }

        _ => {}
    }

    // All other messages → forward to original WndProc
    let original_proc = ORIGINAL_WNDPROC.load(Ordering::SeqCst);
    if original_proc != 0 {
        let proc_fn: unsafe extern "system" fn(isize, u32, usize, isize) -> isize =
            std::mem::transmute(original_proc);
        return proc_fn(hwnd, msg, wparam, lparam);
    }

    DefWindowProcW(hwnd, msg, wparam, lparam)
}

// ═════════════════════════════════════════════════════════════════
//  Server Management
// ═════════════════════════════════════════════════════════════════

/// Start the Fresh 2 Vite dev server as a subprocess.
fn start_fresh_server() -> Child {
    #[cfg(target_os = "windows")]
    let deno_cmd = "deno.exe";
    #[cfg(not(target_os = "windows"))]
    let deno_cmd = "deno";

    Command::new(deno_cmd)
        .args(["task", "dev"])
        .current_dir("..")
        .spawn()
        .expect("Failed to start Vite dev server — is 'deno' in PATH?")
}

/// Block until the TCP server accepts connections.
fn wait_for_server(timeout_secs: u64) {
    use std::time::Instant;
    let start = Instant::now();

    loop {
        if start.elapsed().as_secs() >= timeout_secs {
            eprintln!("[Desktop] ERROR: Server did not respond within {timeout_secs}s");
            std::process::exit(1);
        }

        match std::net::TcpStream::connect("127.0.0.1:5173") {
            Ok(_) => {
                println!("[Desktop] ✓ Server ready on port 5173");
                return;
            }
            Err(_) => {
                thread::sleep(Duration::from_millis(200));
            }
        }
    }
}
