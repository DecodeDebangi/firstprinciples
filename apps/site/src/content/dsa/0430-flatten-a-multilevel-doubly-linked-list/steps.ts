import type { Approach, InputField, ListRow, Prepared, Tone } from "@firstprinciples/ui";

/** A multilevel list as text: "4 2 [6 1 [8]] 7". Brackets right after a node hold that node's child list. */
export type Input = { list: string };
type P = Input;
export const example: Input = { list: "4 2 [6 1 [8]] 7" };
export const fields: InputField[] = [{ key: "list", label: "list ( [ … ] after a node is its child list )", kind: "text" }];

type Node = { val: number; next: number; child: number }; // indices, -1 = none
function parse(text: string): { nodes: Node[]; head: number } | string {
  const toks = text.replace(/\[/g, " [ ").replace(/\]/g, " ] ").split(/[\s,]+/).filter(Boolean);
  const nodes: Node[] = [];
  let i = 0;
  const chain = (depth: number): number | string => {
    let first = -1, last = -1;
    while (i < toks.length && toks[i] !== "]") {
      const tok = toks[i];
      if (tok === "[") {
        if (last < 0) return "A [ must come right after a node: it opens that node's child list.";
        if (nodes[last].child >= 0) return "A node can have only one child list.";
        i++;
        const c = chain(depth + 1);
        if (typeof c === "string") return c;
        if (toks[i] !== "]") return "Every [ needs a matching ].";
        i++;
        if (c < 0) return "A child list can't be empty.";
        nodes[last].child = c;
        continue;
      }
      const v = Number(tok);
      if (!Number.isInteger(v)) return `"${tok}" isn't a whole number.`;
      nodes.push({ val: v, next: -1, child: -1 });
      const k = nodes.length - 1;
      if (last >= 0) nodes[last].next = k; else first = k;
      last = k; i++;
    }
    if (depth === 0 && i < toks.length) return "There's a ] without a matching [.";
    return first;
  };
  const head = chain(0);
  if (typeof head === "string") return head;
  return { nodes, head };
}
export function prepare(raw: Input): Prepared<Input> {
  const r = parse(raw.list);
  if (typeof r === "string") return { error: r };
  if (r.nodes.length === 0) return { error: "Give the list at least one node." };
  if (r.nodes.length > 6) return { error: "Keep it to at most 6 nodes in total, so the flattened list fits." };
  return { input: raw };
}

const END = (id: string) => ({ id, val: "none", kind: "null" as const });
/** Draw the current structure: the main chain, then every child list still hanging off a drawn node (depth first). */
function draw(nodes: Node[], head: number, ptr: Record<string, number> = {}, tones: Record<number, Tone> = {}): ListRow[] {
  const rows: ListRow[] = [];
  const walk = (start: number, label: string) => {
    const ids: number[] = [];
    for (let k = start; k >= 0; k = nodes[k].next) ids.push(k);
    rows.push({ label, nodes: [...ids.map((k) => ({ id: `n${k}`, val: nodes[k].val })), END(`end-${start}`)], arrows: ids.map((_, j) => (j < ids.length - 1 ? "double" as const : "right" as const)),
      pointers: Object.fromEntries(Object.entries(ptr).filter(([, k]) => ids.includes(k)).map(([p, k]) => [p, `n${k}`])),
      tones: Object.fromEntries(ids.filter((k) => tones[k]).map((k) => [`n${k}`, tones[k]])) });
    for (const k of ids) if (nodes[k].child >= 0) walk(nodes[k].child, `child of the ${nodes[k].val}`);
  };
  if (head >= 0) walk(head, "main");
  return rows;
}

const collect: Approach<P> = {
  id: "collect",
  name: "Collect in order, then relink",
  code: `function flatten(head)
    order ← empty list
    visit(head, order)
    for i ← 0 to length(order) - 2
        order[i].next ← order[i + 1]
        order[i + 1].prev ← order[i]
    for each node in order
        node.child ← none
    return head

function visit(node, order)
    while node ≠ none
        order.push(node)
        visit(node.child, order)
        node ← node.next
`,
  run({ list }, t) {
    const { nodes, head } = parse(list) as { nodes: Node[]; head: number };
    const order: number[] = [];
    const grid = () => ({ title: "order", rows: [order.length ? order.map((k) => nodes[k].val) : ["(empty)"]] });
    t.step({ line: 3, array: [], lists: draw(nodes, head), grid: grid(), vars: {},
      message: "Every node has next and prev, and some also have a child: the head of another list one level down. Flattening puts each child list right after its parent, before the parent's next. That's the order a depth-first walk visits them in, so first list the nodes in that order." });
    let asked = false;
    const visit = (start: number) => {
      for (let k = start; k >= 0; k = nodes[k].next) {
        t.op();
        order.push(k);
        const hasChild = nodes[k].child >= 0;
        const ask = hasChild && !asked ? (asked = true, { ask: { q: `The ${nodes[k].val} has a child list starting with the ${nodes[nodes[k].child].val}. What goes into order next?`, options: [`The ${nodes[nodes[k].child].val}: the child list comes first`, nodes[k].next >= 0 ? `The ${nodes[nodes[k].next].val}: the next node on this level` : "Nothing: this level has ended", "The head again"], answer: 0 } }) : {};
        t.step({ ...ask, line: 13, array: [], lists: draw(nodes, head, { node: k }, Object.fromEntries(order.map((q) => [q, (q === k ? "active" : "visited") as Tone]))), grid: grid(), vars: {},
          message: `Add the ${nodes[k].val} to order.${hasChild ? ` It has a child list, so visit that whole list (and its children) before moving on to ${nodes[k].next >= 0 ? `the ${nodes[nodes[k].next].val}` : "the end of this level"}.` : ""}` });
        if (hasChild) visit(nodes[k].child);
      }
    };
    visit(head);
    t.op(order.length);
    const flat: Node[] = nodes.map((x) => ({ ...x }));
    order.forEach((k, j) => { flat[k].next = j + 1 < order.length ? order[j + 1] : -1; flat[k].child = -1; });
    t.step({ line: 9, array: [], lists: draw(flat, head, {}, Object.fromEntries(order.map((k) => [k, "settled" as Tone]))), grid: grid(), vars: {}, done: "found",
      message: `Relink the nodes in that order, both next and prev, and clear every child: ${order.map((k) => nodes[k].val).join(" ⇄ ")}. O(n) time, but order holds all n nodes, and the recursion can go as deep as the levels: O(n) extra space.` });
  },
};

const splice: Approach<P> = {
  id: "splice",
  name: "Splice each child list in place (optimal)",
  code: `function flatten(head)
    curr ← head
    while curr ≠ none
        if curr.child ≠ none
            child ← curr.child
            tail ← child
            while tail.next ≠ none
                tail ← tail.next
            tail.next ← curr.next
            if curr.next ≠ none
                curr.next.prev ← tail
            curr.next ← child
            child.prev ← curr
            curr.child ← none
        curr ← curr.next
    return head
`,
  run({ list }, t) {
    const parsed = parse(list) as { nodes: Node[]; head: number };
    const nodes = parsed.nodes.map((x) => ({ ...x })), head = parsed.head;
    const done = new Set<number>();
    const tn = (extra: Record<number, Tone> = {}) => ({ ...Object.fromEntries([...done].map((k) => [k, "visited" as Tone])), ...extra });
    t.step({ line: 2, array: [], lists: draw(nodes, head, { curr: head }), vars: {},
      message: "Walk the main list with curr. Whenever curr has a child list, splice that whole list in between curr and curr.next, right where it belongs. Its own children come along and get handled when curr reaches them." });
    let asked = false;
    for (let curr = head; curr >= 0; curr = nodes[curr].next) {
      t.op();
      if (nodes[curr].child < 0) {
        done.add(curr);
        t.step({ line: 15, array: [], lists: draw(nodes, head, { curr }, tn({ [curr]: "active" })), vars: {},
          message: `The ${nodes[curr].val} has no child: move on.` });
        continue;
      }
      const child = nodes[curr].child;
      let tail = child;
      t.step({ line: 6, array: [], lists: draw(nodes, head, { curr, child, tail }, tn({ [curr]: "active", [child]: "compare" })), vars: {},
        message: `The ${nodes[curr].val} has a child list starting at the ${nodes[child].val}. To splice it in, we also need its last node, so that the last node can point on to ${nodes[curr].next >= 0 ? `the ${nodes[nodes[curr].next].val}` : "none"}.` });
      while (nodes[tail].next >= 0) {
        t.op();
        tail = nodes[tail].next;
        t.step({ line: 8, array: [], lists: draw(nodes, head, { curr, child, tail }, tn({ [curr]: "active", [tail]: "compare" })), vars: {}, message: `tail moves to the ${nodes[tail].val}.` });
      }
      const after = nodes[curr].next;
      const ask = !asked ? (asked = true, { ask: { q: `Splicing the child list in after the ${nodes[curr].val}: what should its last node, the ${nodes[tail].val}, point to next?`, options: [after >= 0 ? `The ${nodes[after].val}, which used to follow the ${nodes[curr].val}` : "none, since nothing followed", `The ${nodes[curr].val}, its parent`, `The ${nodes[child].val}, the child list's first node`], answer: 0 } }) : {};
      nodes[tail].next = after;
      nodes[curr].next = child;
      nodes[curr].child = -1;
      t.op(4);
      done.add(curr);
      t.step({ ...ask, line: 14, array: [], lists: draw(nodes, head, { curr }, tn({ [curr]: "active", ...Object.fromEntries((() => { const ids: number[] = []; for (let k = child; k !== after && k >= 0; k = nodes[k].next) ids.push(k); return ids.map((k) => [k, "found" as Tone]); })()) })), vars: {},
        message: `Four links splice it in: the ${nodes[tail].val} points on to ${after >= 0 ? `the ${nodes[after].val} (and it points back)` : "none"}, the ${nodes[curr].val} points to the ${nodes[child].val} (and it points back). Then clear the ${nodes[curr].val}'s child. The child list is now part of the main list.` });
    }
    const order: number[] = []; for (let k = head; k >= 0; k = nodes[k].next) order.push(k);
    t.step({ line: 16, array: [], lists: draw(nodes, head, {}, Object.fromEntries(order.map((k) => [k, "settled" as Tone]))), vars: {}, done: "found",
      message: `Flat: ${order.map((k) => nodes[k].val).join(" ⇄ ")}. curr visits each node once, and each tail search walks a child list once: O(n) time. Only a few pointers: O(1) extra space.` });
  },
};

export const approaches = { collect, splice };
