// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { glossaryPlugin } from "./src/lib/rehype-glossary.mjs";

export default defineConfig({
  // The live domain (Vercel). Used for canonical URLs, link previews and the sitemap.
  site: "https://firstprinciples.debangi.com",
  // Astro's default Markdown processor, plus the glossary plugin (marks each term's first use on a page).
  markdown: { processor: satteri({ hastPlugins: [glossaryPlugin] }) },
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.endsWith("/404/") && !page.includes("/studio/") })],
  // resvg ships a native binary; load it from node_modules instead of bundling it.
  vite: { ssr: { external: ["@resvg/resvg-js"] } },
});
