import { define } from "@/utils.ts";

export default define.page(function Error404() {
  return (
    <div class="error-404">
      <h1 class="error-404-title">404 — Page not found</h1>
      <p class="error-404-text">The page you were looking for doesn't exist.</p>
      <a href="/" class="error-404-link">Go back home</a>
    </div>
  );
});
