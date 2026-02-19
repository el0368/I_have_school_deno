---
name: fresh-v2
description: Deep technical knowledge and patterns for Deno Fresh 2.x
---

# Fresh 2.x Framework SKILL

## Domain

Deno, Island Architecture, Fresh 2.x Server, Preact Signals, Server-Side Rendering (SSR).

## Capabilities & Patterns

This skill provides the technical foundation for working with Fresh 2.x in this project.

### 1. Island Architecture

- Render server-generated HTML by default.
- Use `islands/` directory for interactive client-side components.
- Island props must be serializable (JSON + Signals, URL, Date). **No functions.**

### 2. Routing (File-system based)

- Routes live in `routes/`.
- Dynamic routes use `[id].tsx`.
- Standard files: `_app.tsx` (Global wrapper), `_layout.tsx` (Directory layout), `_middleware.ts`.

### 3. Handlers & Data Fetching

- Use `define.handlers` for server-side logic (GET, POST, etc.).
- Use `define.page` for rendering components.
- Data fetching happens in handlers before reaching the components.

### 4. Partials & SPA Navigation

- Use `f-client-nav` on the `<body>` in `_app.tsx` to enable SPA-like navigation.
- Wrap page components in `<Partial name="body">` for seamless updates.
- This results in no full page reload, only updating the inner content.

### 5. Client-Side Entry & HMR

- `client.ts` is the entry point for the browser.
- Import CSS files in `client.ts` (e.g., `import "@/static/discord.css"`) to enable Hot Module Replacement (HMR) for styles.

### 6. Code Snippets & Patterns

- **Basic Page**:
  ```tsx
  import { define } from "@/utils.ts";
  export default define.page(() => (
    <main>
      <h1>Hello</h1>
    </main>
  ));
  ```
- **Middleware**:
  ```tsx
  import { define } from "@/utils.ts";
  export const handler = define.middleware(async (ctx) => {
    const resp = await ctx.next();
    return resp;
  });
  ```
- **Island with Signals**:
  ```tsx
  import { useSignal } from "@preact/signals";
  export default function Counter() {
    const count = useSignal(0);
    return <button onClick={() => count.value++}>{count}</button>;
  }
  ```

## Reference documentation

The full text of the original `fresh_llm.txt` is stored here for deep context lookup.

---

(Content from original `fresh_llm.txt` follows)

## Routing

Fresh supports file-system based routing in the `routes/` directory.

### Basic Route

Create a file `routes/about.tsx`:

```tsx
import { define } from "@/utils.ts";

export default define.page(() => {
  return (
    <main>
      <h1>About Page</h1>
    </main>
  );
});
```

### Dynamic Routes

Use square brackets for dynamic parameters, e.g., `routes/books/[id].tsx`:

```tsx
import { define } from "@/utils.ts";

export default define.page((ctx) => {
  return <div>Book ID: {ctx.params.id}</div>;
});
```

## Data Fetching & Handlers

Data fetching is performed on the server using **Handlers**. You can define a handler to fetch data before rendering the page.

```tsx
import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const user = await fetchUser(ctx.params.id);
    if (!user) return ctx.renderNotFound();
    return ctx.render({ user });
  },
  async POST(ctx) {
    const form = await ctx.req.formData();
    // Process form...
    return ctx.redirect("/success");
  },
});

export default define.page<typeof handler>((props) => {
  const { user } = props.data;
  return <div>Hello, {user.name}</div>;
});
```

## Islands (Client-Side Interactivity)

Islands are Preact components located in the `islands/` directory. They are the **only** components that execute JavaScript in the browser.

### Creating an Island

`islands/Countdown.tsx`:

```tsx
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function Countdown(props: { target: string }) {
  const count = useSignal(10);

  useEffect(() => {
    // Client-side logic here
    const timer = setInterval(() => count.value--, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```
