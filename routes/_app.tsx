import { define } from "@/utils.ts";
import { Partial } from "fresh/runtime";

export default define.page(function App({ Component, url }) {
  const isDesktop = url.searchParams.has("desktop");
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sovereign Academy</title>
        <link rel="stylesheet" href="/discord.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body class={`discord-app${isDesktop ? " desktop-mode" : ""}`} f-client-nav>
        <Partial name="body">
          <Component />
        </Partial>
      </body>
    </html>
  );
});
