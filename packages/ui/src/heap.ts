import type { TreeNodeData } from "./trace";

/** Draw a heap array as a tree: item i's children are items 2i + 1 and 2i + 2. Ids follow items, so swaps slide. */
export function heapTree(items: { id: string; val: number | string }[]): { root: string | null; nodes: TreeNodeData[] } {
  return {
    root: items[0]?.id ?? null,
    nodes: items.map((it, i) => ({ id: it.id, val: it.val, left: items[2 * i + 1]?.id ?? null, right: items[2 * i + 2]?.id ?? null })),
  };
}

/**
 * A binary heap ordered by `before(a, b)` ("a belongs above b"). Every comparison calls `onCompare`, so tracers can
 * count real work with `t.op()`. Pass a "less than" for a min-heap and a "greater than" for a max-heap.
 */
export class Heap<T> {
  items: T[] = [];
  constructor(private before: (a: T, b: T) => boolean, private onCompare: () => void = () => {}) {}
  get size() { return this.items.length; }
  peek(): T | undefined { return this.items[0]; }
  private cmp(i: number, j: number) { this.onCompare(); return this.before(this.items[i], this.items[j]); }
  private swap(i: number, j: number) { [this.items[i], this.items[j]] = [this.items[j], this.items[i]]; }
  push(x: T) {
    this.items.push(x);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.cmp(i, p)) break;
      this.swap(i, p);
      i = p;
    }
  }
  private siftDown(i: number) {
    const a = this.items;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let best = i;
      if (l < a.length && this.cmp(l, best)) best = l;
      if (r < a.length && this.cmp(r, best)) best = r;
      if (best === i) return;
      this.swap(i, best);
      i = best;
    }
  }
  /** Bottom-up build, like Python's heapq.heapify: O(n). */
  heapify(xs: T[]) {
    this.items = [...xs];
    for (let i = (this.items.length >> 1) - 1; i >= 0; i--) this.siftDown(i);
  }
  pop(): T | undefined {
    const a = this.items;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) { a[0] = last; this.siftDown(0); }
    return top;
  }
}
