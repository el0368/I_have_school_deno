import { define } from "@/utils.ts";

export default define.page(function App({ Component, url }) {
  const isDesktop = url.searchParams.has("desktop");
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sovereign Academy</title>
        <link rel="stylesheet" href="/discord.css" />
      </head>
      <body class={`discord-app${isDesktop ? " desktop-mode" : ""}`}>
        <Component />
      </body>
    </html>
  );
});
