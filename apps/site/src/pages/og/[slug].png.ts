/**
 * Per-problem link preview images, drawn at build time: /og/<slug>.png (1200×630).
 * satori lays the card out (flexbox) into SVG; resvg turns that into a PNG.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const C = {
  bg: "#faf5ec", bgTop: "#f8ead9", ink: "#2b2118", ink2: "#5e4e3e", accent: "#b4532a",
  soft: "#f8e4d6", border: "#e6d9c4", cell: "#f4ecdf",
  easy: ["#e1eed6", "#4d7d35"], medium: ["#fbe8b8", "#b07a12"], hard: ["#f6dcd6", "#b0413a"],
} as const;

// Minimal element helper so this file needs no JSX.
type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string)[]): Node =>
  ({ type, props: { style, children: children.length === 1 ? children[0] : children } });

const fontDir = join(process.cwd(), "src/og-fonts");
const fonts = Promise.all([
  ["Fraunces", "Fraunces-SemiBold.ttf", 600, "normal"],
  ["Fraunces", "Fraunces-SemiBoldItalic.ttf", 600, "italic"],
  ["Inter", "Inter-Medium.ttf", 500, "normal"],
  ["Inter", "Inter-SemiBold.ttf", 600, "normal"],
  ["JetBrains Mono", "JetBrainsMono-SemiBold.ttf", 600, "normal"],
].map(async ([name, file, weight, style]) => ({
  name: name as string, data: await readFile(join(fontDir, file as string)), weight: weight as 500 | 600, style: style as "normal" | "italic",
})));

export const getStaticPaths = (async () =>
  (await getCollection("dsa")).map((p) => ({ params: { slug: p.id }, props: { p } }))) satisfies GetStaticPaths;

function card(p: CollectionEntry<"dsa">): Node {
  const { title, leetcode, difficulty, topics, best } = p.data;
  const [pillBg, pillInk] = C[difficulty.toLowerCase() as "easy" | "medium" | "hard"];
  const titleSize = title.length <= 18 ? 96 : title.length <= 28 ? 80 : 64;
  const pill = (text: string, bg: string, color: string) =>
    h("div", { display: "flex", padding: "8px 20px", borderRadius: 999, background: bg, color, fontSize: 26, fontFamily: "Inter", fontWeight: 600 }, text);

  return h("div", {
    // satori adds padding on top of width/height, so size the inner area: 1200−2×72 by 630−2×60.
    width: 1056, height: 510, display: "flex", flexDirection: "column", justifyContent: "space-between",
    padding: "60px 72px", color: C.ink, fontFamily: "Inter",
    backgroundImage: `linear-gradient(180deg, ${C.bgTop} 0%, ${C.bg} 100%)`,
  },
    h("div", { display: "flex", justifyContent: "space-between", alignItems: "center" },
      h("div", { display: "flex", fontFamily: "Fraunces", fontSize: 36 },
        h("span", {}, "first"),
        h("span", { fontStyle: "italic", color: C.accent }, "principles")),
      h("div", { display: "flex", gap: 12 },
        pill(`LeetCode #${leetcode.number}`, "#fffdf8", C.ink2),
        pill(difficulty, pillBg, pillInk))),
    h("div", { display: "flex", flexDirection: "column", gap: 22 },
      h("div", { display: "flex", fontFamily: "Fraunces", fontSize: titleSize, lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: 1050 }, title),
      h("div", { display: "flex", gap: 12, flexWrap: "wrap" },
        ...topics.slice(0, 4).map((t) => pill(t, C.soft, C.accent)))),
    h("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
      h("div", { display: "flex", flexDirection: "column", gap: 6 },
        h("div", { display: "flex", fontSize: 24, color: C.ink2 }, "Best solution"),
        h("div", { display: "flex", fontFamily: "JetBrains Mono", fontSize: 40, color: C.ink },
          `${best.time} time · ${best.space} space`)),
      h("div", { display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 26, color: C.ink2, lineHeight: 1.4 },
        h("div", { display: "flex" }, "Brute force → optimal"),
        h("div", { display: "flex" }, "Watch every step run"))),
  );
}

export const GET: APIRoute<{ p: CollectionEntry<"dsa"> }> = async ({ props }) => {
  const svg = await satori(card(props.p) as unknown as React.ReactNode, { width: 1200, height: 630, fonts: await fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
