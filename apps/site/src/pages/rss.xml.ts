import type { APIRoute } from "astro";
import { feedItems } from "../lib/feed";

/**
 * /rss.xml: every problem and read, newest first, for feed readers.
 * Dates come from each page's `added`, so the feed only changes when content does.
 * /feed/ is the human page that explains it (Chrome is dropping XSLT, so the feed itself stays plain XML).
 */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, "");
  const items = await feedItems();
  const latest = items[0]?.date ?? new Date(0);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>firstprinciples</title>
    <link>${base}/</link>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <description>New DSA problems and reads on firstprinciples: each problem goes from brute force to optimal with step-by-step animations and derived complexity.</description>
    <language>en</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>
${items.map((it) => `    <item>
      <title>${esc(it.title)}</title>
      <link>${base}${it.path}</link>
      <guid isPermaLink="true">${base}${it.path}</guid>
      <pubDate>${it.date.toUTCString()}</pubDate>
      <description>${esc(it.summary)}</description>
${it.categories.map((c) => `      <category>${esc(c)}</category>`).join("\n")}
    </item>`).join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
