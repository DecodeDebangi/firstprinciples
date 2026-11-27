import { measureGrowth } from "@firstprinciples/ui";
import { avlInserts, plainInserts, sortedInserts } from "./steps";

/** n values inserted in increasing order: a chain for the plain BST. */
export const growth = measureGrowth(
  [{ approach: plainInserts, slot: 1 }, { approach: avlInserts, slot: 3 }],
  sortedInserts,
  [8, 16, 32, 64, 128, 256],
);
