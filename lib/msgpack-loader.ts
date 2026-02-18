// lib/msgpack-loader.ts
//
// Thin re-export of @msgpack/msgpack's decode function.
// Lives in a separate file so that Vite/Vitest only processes it
// when constructing the *real* app bundle — tests import from
// exercise-loader.ts directly and inject a stub via setMsgpackDecoder(),
// meaning this file is never transformed in the test environment.

export { decode } from "@msgpack/msgpack";
