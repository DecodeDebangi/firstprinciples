import { getCollection } from "astro:content";

export type FeedItem = { title: string; path: string; summary: string; date: Date; categories: string[] };

/**
 * Every problem and read, newest first. Same-day entries list problems by LeetCode number, then reads by title.
 * Shared by /rss.xml and the /feed/ page so they always agree.
 */
export async function feedItems(): Promise<FeedItem[]> {
  const problems = await getCollection("dsa");
  const concepts = await getCollection("concepts");
  const rows = [
    ...problems.map((p) => ({
      title: `LeetCode ${p.data.leetcode.number}: ${p.data.title}`,
      path: `/dsa/${p.id}/`,
      summary: `${p.data.summary} ${p.data.difficulty} · best ${p.data.best.time} time, ${p.data.best.space} space.`,
      date: p.data.added,
      categories: [...p.data.topics, p.data.difficulty],
      order: p.data.leetcode.number,
    })),
    ...concepts.map((c) => ({
      title: `Read: ${c.data.title}`,
      path: `/concepts/${c.id}/`,
      summary: c.data.summary,
      date: c.data.added,
      categories: [c.data.topic, c.data.kind],
      order: Infinity,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime() || (a.order === b.order ? 0 : a.order < b.order ? -1 : 1) || a.title.localeCompare(b.title));
  return rows.map(({ order: _, ...item }) => item);
}
