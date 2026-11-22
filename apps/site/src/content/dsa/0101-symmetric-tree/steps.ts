import { type Approach, type Tone, type TreeData } from "@firstprinciples/ui";
import { build, treeFields, treePrepare, view, type TreeInput } from "../../concepts/54-tree-recursion/steps";

export type Input = TreeInput;
export const example: Input = { root: [6, 4, 4, 9, 2, 2, 9, null, 5, null, null, null, null, 5] };
export const fields = treeFields;
export const prepare = treePrepare;

const levels: Approach<Input> = {
  id: "levels",
  name: "Each level must read the same both ways",
  code: `function isSymmetric(root)
    level ← [root]
    while level has a node that isn't none
        vals ← each node's value, or none
        if vals ≠ vals reversed
            return false
        level ← every child of level, none included
    return true
`,
  run({ root: vals }, t) {
    const tr = build(vals);
    const seen: string[] = [];
    let level: (string | null)[] = [tr.root], depth = 0, asked = false;
    t.step({ line: 2, array: [], trees: view(tr), vars: {},
      message: "A mirror image flips left and right. So each level, read left to right with gaps marked, must read the same backwards. Check one level at a time, keeping the gaps (none) so their positions count." });
    while (level.some((x) => x)) {
      const vs = level.map((id) => (id ? String(tr.by.get(id)!.val) : "·"));
      t.op(level.length);
      const ok = vs.every((v, i) => v === vs[vs.length - 1 - i]);
      const ask = !asked && depth > 0 ? (asked = true, { ask: { q: `Level ${depth} reads ${vs.join(" ")} (· marks a gap). Does it read the same backwards?`, options: [ok ? "Yes" : "No", ok ? "No" : "Yes"], answer: 0 } }) : {};
      const ids = level.filter(Boolean) as string[];
      t.step({ ...ask, line: ok ? 7 : 6, array: [], trees: view(tr, { ...Object.fromEntries(seen.map((x) => [x, "settled" as Tone])), ...Object.fromEntries(ids.map((x) => [x, (ok ? "found" : "miss") as Tone])) }), grid: { title: `level ${depth}`, rows: [vs] }, vars: { level: depth },
        message: ok ? `Level ${depth}: ${vs.join(" ")} reads the same backwards.` : `Level ${depth}: ${vs.join(" ")} backwards is ${[...vs].reverse().join(" ")}. Not a mirror: return false.` });
      if (!ok) {
        t.step({ line: 6, array: [], trees: view(tr, Object.fromEntries(ids.map((x) => [x, "miss" as Tone]))), grid: { title: `level ${depth}`, rows: [vs] }, vars: { answer: "false" }, done: "notfound",
          message: `Not symmetric. The queue held a whole level at a time, gaps included: O(n) time, O(w) space for the widest level.` });
        return;
      }
      seen.push(...ids);
      level = level.flatMap((id) => (id ? [tr.by.get(id)!.left, tr.by.get(id)!.right] : []));
      depth++;
    }
    t.step({ line: 8, array: [], trees: view(tr, Object.fromEntries(seen.map((x) => [x, "settled" as Tone]))), vars: { answer: "true" }, done: "found",
      message: `Every level reads the same both ways: symmetric. Each node and gap was looked at once: O(n) time, but a whole level is held at once, O(w) space for the widest level.` });
  },
};

const pairs: Approach<Input> = {
  id: "pairs",
  name: "Compare mirror pairs recursively",
  code: `function isSymmetric(root)
    return mirror(root.left, root.right)
function mirror(a, b)
    if a = none and b = none
        return true
    if a = none or b = none or a.val ≠ b.val
        return false
    return mirror(a.left, b.right)  // outside pair
        and mirror(a.right, b.left)  // inside pair
`,
  run({ root: vals }, t) {
    const tr = build(vals), done: Record<string, Tone> = {}, stack: string[] = [];
    const pv = (tones: Record<string, Tone>, a?: string | null, b?: string | null): TreeData[] => [{ ...view(tr, tones)[0], pointers: { ...(a ? { a } : {}), ...(b ? { b } : {}) } }];
    const name = (id: string | null) => (id ? String(tr.by.get(id)!.val) : "none");
    t.step({ line: 2, array: [], trees: pv({}, tr.root), stack: [], vars: {},
      message: "Two subtrees are mirror images when their tops match, the outside pair (left of one, right of the other) mirrors, and the inside pair mirrors. Start with the root's two children." });
    let asked = false, failed: [string | null, string | null] | null = null;
    const go = (a: string | null, b: string | null): boolean => {
      t.op();
      if (!a && !b) return true;
      stack.push(`mirror(${name(a)}, ${name(b)})`);
      const A = a ? tr.by.get(a)! : null, B = b ? tr.by.get(b)! : null;
      const ok = !!A && !!B && A.val === B.val;
      const ask = !asked && A && B && a !== tr.root ? (asked = true, { ask: { q: `Comparing ${A.val} with ${B.val}. If they match, which pair is checked next?`, options: [`${name(A.left)} with ${name(B.right)}`, `${name(A.left)} with ${name(B.left)}`], answer: 0 } }) : {};
      if (ok) { done[a!] = "settled"; done[b!] = "settled"; }
      t.step({ ...(ask.ask && ask.ask.options[0] !== ask.ask.options[1] ? ask : {}), line: ok ? 8 : 7, array: [], trees: pv({ ...done, ...(a ? { [a]: ok ? "found" : "miss" } : {}), ...(b ? { [b]: ok ? "found" : "miss" } : {}) }, a, b), stack: [...stack], vars: { a: name(a), b: name(b) },
        message: ok ? `${A!.val} and ${B!.val} match. Next, the outside pair (${name(A!.left)}, ${name(B!.right)}), then the inside pair (${name(A!.right)}, ${name(B!.left)}).` : !A || !B ? `${name(a)} against ${name(b)}: one side has a node where the other has none. Not a mirror.` : `${A.val} against ${B.val}: different values. Not a mirror.` });
      if (!ok) { failed = [a, b]; stack.pop(); return false; }
      const r = go(A!.left, B!.right) && go(A!.right, B!.left);
      stack.pop();
      return r;
    };
    const res = !tr.root || go(tr.by.get(tr.root)!.left, tr.by.get(tr.root)!.right);
    const f = failed as [string | null, string | null] | null;
    t.step({ line: res ? 8 : 7, array: [], trees: pv({ ...done, ...(tr.root ? { [tr.root]: res ? "settled" : "visited" } : {}), ...(f && f[0] ? { [f[0]]: "miss" } : {}), ...(f && f[1] ? { [f[1]]: "miss" } : {}) }), stack: [], vars: { answer: res ? "true" : "false" }, done: res ? "found" : "notfound",
      message: `${res ? "Every pair matched: symmetric." : "A pair didn't match: not symmetric."} Each node is compared once with its mirror partner: O(n) time, and only O(h) space for the recursion.` });
  },
};

export const approaches = { levels, pairs };
