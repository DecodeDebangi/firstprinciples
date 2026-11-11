// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  // The live domain (Vercel). Used for canonical URLs, link previews and the sitemap.
  site: "https://firstprinciples.debangi.com",
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.endsWith("/404/") })],
});
