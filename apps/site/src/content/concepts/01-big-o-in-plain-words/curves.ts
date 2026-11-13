import type { GrowthSeries } from "@firstprinciples/ui";

/** Reference curves for the Big-O explainer: the number of basic steps each class takes at size n. */
const sizes = [8, 16, 32, 64, 128, 256, 512, 1024];
const series = (name: string, slot: 1 | 2 | 3, f: (n: number) => number): GrowthSeries =>
  ({ name, slot, points: sizes.map((n) => [n, Math.round(f(n))] as [number, number]) });

/** The everyday trio: how much log n, n and n log n differ. */
export const gentle = [
  series("O(log n)", 3, (n) => Math.log2(n)),
  series("O(n)", 2, (n) => n),
  series("O(n log n)", 1, (n) => n * Math.log2(n)),
];

/** Linear vs quadratic, on a much bigger scale. */
const small = [8, 16, 32, 48, 64, 96, 128];
export const steep: GrowthSeries[] = [
  { name: "O(n²)", slot: 1, points: small.map((n) => [n, n * n] as [number, number]) },
  { name: "O(n)", slot: 2, points: small.map((n) => [n, n] as [number, number]) },
];
