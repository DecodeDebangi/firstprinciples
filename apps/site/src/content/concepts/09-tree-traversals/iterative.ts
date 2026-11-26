import { treeFromLevelOrder, type Approach, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";
import type { Input } from "./steps";

/**
 * The three depth-first orders written with an explicit stack instead of recursion (used by LeetCode 94, 144, 145).
 * Pre-order pops a node, writes it, then pushes right before left. In-order pushes the whole left path, pops one,
 * writes it, then moves to its right child. Post-order writes node, right, left (the mirror of pre-order) and reverses.
 */
type Order = "pre" | "in" | "post";

const codes: Record<Order, string> = {
  pre: `function preorderTraversal(root)
    out, stack ← [], empty stack
    if root ≠ none
        stack.push(root)
    while stack not empty
        node ← stack.pop()
        out.push(node.val)
        if node.right ≠ none
            stack.push(node.right)  // right first
        if node.left ≠ none
            stack.push(node.left)  // left on top
    return out
`,
  in: `function inorderTraversal(root)
    out, stack ← [], empty stack
    node ← root
    while node ≠ none or stack not empty
        while node ≠ none
            stack.push(node)
            node ← node.left
        node ← stack.pop()
        out.push(node.val)
        node ← node.right
    return out
`,
  post: `function postorderTraversal(root)
    out, stack ← [], empty stack
    if root ≠ none
        stack.push(root)
    while stack not empty
        node ← stack.pop()
        out.push(node.val)  // node, right, left
        if node.left ≠ none
            stack.push(node.left)
        if node.right ≠ none
            stack.push(node.right)
    return reverse(out)
`,
};

const intro: Record<Order, string> = {
  pre: "Recursion keeps its own stack of calls. Here the stack is explicit: pop a node, write it down, then push its children. Push the right child first, so the left one is on top and comes out first.",
  in: "In-order needs a node's whole left subtree before the node itself. So go left as far as possible, pushing every node on the way; then pop one, write it down, and do the same from its right child.",
  post: "Post-order is the hardest to write with a stack, because a node must wait for both subtrees. A trick avoids that: write node, right, left (pre-order with the children swapped), then reverse the list. Reversed, it reads left, right, node.",
};

export function iterative(order: Order): Approach<Input> {
  return {
    id: "iterative",
    name: "Iterative, with an explicit stack",
    code: codes[order],
    run({ root: vals }, t) {
      const { root, nodes } = treeFromLevelOrder(vals);
      const by = new Map(nodes.map((n) => [n.id, n]));
      const out: (number | string)[] = [], notes: Record<string, string> = {}, stack: string[] = [];
      let asked = 0;
      const grid = (title = "out") => ({ title, rows: [out.length ? [...out] : ["—"]] });
      const tones = (extra: Record<string, Tone> = {}): Record<string, Tone> => ({ ...Object.fromEntries(stack.map((k) => [k, "side-b" as Tone])), ...Object.fromEntries(Object.keys(notes).map((k) => [k, "settled" as Tone])), ...extra });
      const view = (extra: Record<string, Tone> = {}, at?: string | null): TreeData[] => [{ root, nodes, tones: tones(extra), notes: { ...notes }, pointers: at ? { node: at } : {} }];
      const frames = () => stack.map((k) => String(by.get(k)!.val));
      const v = (k: string) => by.get(k)!.val;
      const askTop = (): { ask?: { q: string; options: string[]; answer: number } } => {
        if (asked >= 3 || stack.length < 2) return {};
        const top = v(stack[stack.length - 1]), under = v(stack[stack.length - 2]);
        if (top === under) return {};
        asked++;
        return { ask: { q: `The stack holds ${frames().join(", ")} (top last). Which node is written down next?`, options: [String(top), String(under)], answer: 0 } };
      };
      t.step({ line: 2, array: [], trees: view(), grid: grid(), stack: [], stackTitle: "stack (top first)", vars: { written: 0 }, message: intro[order] });
      const write = (n: TreeNodeData, q: object, line: number, why: string) => {
        out.push(n.val);
        notes[n.id] = `#${out.length}`;
        t.step({ ...q, line, array: [], trees: view({ [n.id]: "found" }, n.id), grid: grid(), stack: frames(), stackTitle: "stack (top first)", vars: { node: n.val, written: out.length }, message: why.replace("{#}", `#${out.length}`) });
      };
      if (order === "in") {
        let cur: string | null = root;
        while (cur || stack.length) {
          const pushed: string[] = [];
          while (cur) { t.op(); stack.push(cur); pushed.push(cur); cur = by.get(cur)!.left; }
          if (pushed.length) t.step({ line: 6, array: [], trees: view(Object.fromEntries(pushed.map((k) => [k, "active" as Tone]))), grid: grid(), stack: frames(), stackTitle: "stack (top first)", vars: { written: out.length },
            message: `Go left as far as possible, pushing ${pushed.map(v).join(", ")}. The last one has no left child, so it's the next in order.` });
          const q = askTop();
          t.op();
          const id = stack.pop()!;
          const n = by.get(id)!;
          write(n, q, 9, `Pop ${n.val}: everything on its left is written already, so write it down ({#}). Then move to its right child${n.right ? `, ${v(n.right)}` : ", but there's none"}.`);
          cur = n.right;
        }
      } else {
        if (root) stack.push(root);
        while (stack.length) {
          const q = askTop();
          t.op();
          const id = stack.pop()!;
          const n = by.get(id)!;
          const first = order === "pre" ? n.right : n.left, second = order === "pre" ? n.left : n.right;
          if (first) stack.push(first);
          if (second) stack.push(second);
          const kids = [first, second].filter(Boolean) as string[];
          write(n, q, 7, `Pop ${n.val} and write it down ({#}).${kids.length ? ` Push ${kids.map(v).join(", then ")}, so ${v(kids[kids.length - 1])} is on top.` : " It has no children."}`);
        }
        if (order === "post") {
          const before = [...out];
          out.reverse();
          t.step({ line: 12, array: [], trees: view(), grid: { title: "out, reversed", rows: [out.length ? [...out] : ["—"]] }, stack: [], stackTitle: "stack (top first)", vars: { written: out.length },
            message: `That wrote node, right, left: [${before.join(", ")}]. Reversed, it's left, right, node: [${out.join(", ")}], the post-order.` });
        }
      }
      t.step({ line: order === "in" ? 11 : 12, array: [], trees: view(), grid: grid(order === "post" ? "post-order" : "out"), stack: [], stackTitle: "stack (top first)", vars: { written: out.length }, done: "found",
        message: `[${out.join(", ")}]. Every node is pushed once and popped once: O(n) time, and the stack holds at most O(h) nodes${order === "pre" ? " plus a waiting right child per level" : ""}.` });
    },
  };
}
