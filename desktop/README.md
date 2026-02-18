# FROZEN CORE (Desktop Shell)

This directory (`desktop/`) is a **Frozen Core** component of Sovereign Academy.

**DO NOT MODIFY THIS CODE.**

## Why?

This Rust shell (`tao` + `wry`) has been audited and verified to provide "Discord-Quality" window behavior:

- `WM_NCHITTEST` for native resizing (Zero Lag)
- `DwmExtendFrameIntoClientArea` for true frameless windows
- Snap Layouts support

## Exceptions

You may only modify this code if:

1. There is a critical security vulnerability in `tao` or `wry`.
2. A Windows update fundamentally breaks the windowing logic.

## How to Develop

- All UI logic lives in `../islands/`.
- This shell is just a "dumb container" that loads `http://localhost:5173`.
