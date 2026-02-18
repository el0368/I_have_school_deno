import { createDefine } from "fresh";

// Shared state type available in middlewares, layouts, and routes
// deno-lint-ignore no-empty-interface
export interface State {
  // Add shared state fields as needed
}

export const define = createDefine<State>();
