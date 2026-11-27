import { measureGrowth, type Approach, type InputField, type Prepared, type Tone, type TreeData, type TreeNodeData } from "@firstprinciples/ui";

export type Input = { folders: string };
export const example: Input = { folders: "/docs, /docs/notes, /pics, /pics/2024, /pics/2024/may, /music/rock" };
export const fields: InputField[] = [{ key: "folders", label: "folders", kind: "raw" }];
const parse = (s: string) => s.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
export function prepare(raw: Input): Prepared<Input> {
  const f = parse(raw.folders);
  if (!f.length || f.length > 7) return { error: "Give 1 to 7 folders, separated by commas." };
  if (f.some((x) => !/^(\/[a-z0-9]{1,6})+$/.test(x))) return { error: 'Write folders like "/pics/2024": a "/" before each name, names of letters and digits.' };
  if (new Set(f).size !== f.length) return { error: "Use different folders." };
  if (f.some((x) => x.split("/").length > 5)) return { error: "Use at most 4 levels per folder." };
  return { input: { folders: f.join(", ") } };
}
const list = (a: string[]) => `[${a.join(", ")}]`;

const pairs: Approach<Input> = {
  id: "pairs", name: "Check every folder against every other",
  code: `function removeSubfolders(folders)
    out ← []
    for each f in folders
        inside ← false
        for each g in folders
            if f starts with g + "/"
                inside ← true
        if not inside
            out.push(f)
    return out
`,
  run(raw, t) {
    const f = parse(raw.folders), out: string[] = [];
    if (t.record) t.step({ line: 2, array: f, vars: { out: "[]" }, message: `A folder is a sub-folder if some other folder plus "/" starts it: "/pics/2024" starts with "/pics/". (Just "starts with" isn't enough: "/picsold" isn't inside "/pics".) The direct way checks every folder against every other.` });
    f.forEach((a, i) => {
      let by = "";
      for (const b of f) { t.op(Math.min(a.length, b.length + 1)); if (!by && a.startsWith(b + "/")) by = b; }
      if (!by) out.push(a);
      if (t.record) t.step({ line: by ? 7 : 9, array: f, tones: { [i]: by ? "discard" : "found" }, vars: { folder: a, out: list(out) }, message: by ? `"${a}" is inside "${by}": drop it.` : `"${a}" isn't inside any other folder: keep it.` });
    });
    if (t.record) t.step({ line: 10, array: f, vars: { out: list(out) }, done: "found", message: `${list(out)}. Every pair was compared: O(n² · L).` });
  },
};

const trie: Approach<Input> = {
  id: "trie", name: "A trie of folder names",
  code: `function removeSubfolders(folders)
    for each f in folders
        insert f's folder names into a trie
        mark the last name's node as a folder
    out ← []
    collect(root, "")
    return out
function collect(node, path)
    for each child c of node, named x
        if c is a folder
            out.push(path + "/" + x)  // skip inside
        else
            collect(c, path + "/" + x)
`,
  run(raw, t) {
    const f = parse(raw.folders);
    const nodes: TreeNodeData[] = [{ id: "root", val: "/", left: null, right: null, kids: [] }];
    const kids = new Map<string, Map<string, string>>([["root", new Map()]]), folder = new Set<string>();
    let k = 0;
    const view = (tones: Record<string, Tone> = {}): TreeData[] => [{ root: "root", nodes: nodes.map((n) => ({ ...n, kids: [...n.kids!] })), tones, notes: Object.fromEntries([...folder].map((id) => [id, "📁"])), layout: "compact" }];
    if (t.record) t.step({ line: 2, array: f, trees: view(), vars: {}, message: "Build a trie where each node is a folder name, not a letter: \"/pics/2024\" is the path pics → 2024. Mark the node where each listed folder ends." });
    for (const p of f) {
      let n = "root"; const path: string[] = [];
      for (const name of p.split("/").slice(1)) {
        t.op(name.length);
        let c = kids.get(n)!.get(name);
        if (!c) { c = `f${k++}`; nodes.push({ id: c, val: name, left: null, right: null, kids: [] }); kids.set(c, new Map()); kids.get(n)!.set(name, c); const pn = nodes.find((x) => x.id === n)!; pn.kids = [...pn.kids!, c].sort((a, b) => String(nodes.find((x) => x.id === a)!.val).localeCompare(String(nodes.find((x) => x.id === b)!.val))); }
        n = c; path.push(c);
      }
      folder.add(n);
      if (t.record) t.step({ line: 4, array: f, tones: { [f.indexOf(p)]: "active" }, trees: view(Object.fromEntries(path.map((x) => [x, "found" as Tone]))), vars: { folder: p }, message: `Insert "${p}": follow or create ${path.length === 1 ? "its name" : `its ${path.length} names`}, and mark the last one as a listed folder (📁).` });
    }
    const out: string[] = [], kept: string[] = [], skipped: string[] = [];
    let asked = 0;
    const collect = (n: string, path: string) => {
      for (const c of nodes.find((x) => x.id === n)!.kids!) {
        t.op();
        const name = String(nodes.find((x) => x.id === c)!.val), here = `${path}/${name}`;
        if (folder.has(c)) {
          out.push(here); kept.push(c);
          const below: string[] = []; const walk = (x: string) => { for (const y of nodes.find((z) => z.id === x)!.kids!) { below.push(y); walk(y); } }; walk(c); skipped.push(...below);
          const ask = t.record && asked < 1 && below.some((b) => folder.has(b)) ? (asked++, { ask: { q: `"${here}" is a listed folder, and there are listed folders under it. What happens to them?`, options: ["They're skipped: they're sub-folders", "They're kept too", "They replace it"], answer: 0 } }) : {};
          if (t.record) t.step({ ...ask, line: 11, array: f, trees: view({ ...Object.fromEntries(kept.map((x) => [x, "found" as Tone])), ...Object.fromEntries(skipped.map((x) => [x, "discard" as Tone])) }), vars: { out: list(out) },
            message: `"${here}" is a listed folder: keep it, and don't look inside${below.length ? `: ${below.length} node${below.length === 1 ? "" : "s"} below it can only be sub-folders` : ""}.` });
        } else collect(c, here);
      }
    };
    collect("root", "");
    if (t.record) t.step({ line: 7, array: f, trees: view({ ...Object.fromEntries(kept.map((x) => [x, "found" as Tone])), ...Object.fromEntries(skipped.map((x) => [x, "discard" as Tone])) }), vars: { out: list(out) }, done: "found", message: `${list(out)}. One insert per folder and one walk that stops at the first listed folder on every path: O(total length).` });
  },
};

export const approaches = { pairs, trie };
export const growth = measureGrowth(
  [{ approach: pairs, slot: 1 }, { approach: trie, slot: 3 }],
  (n) => ({ folders: Array.from({ length: n }, (_, k) => `/d${k % 8}/e${Math.floor(k / 8)}`).join(", ") }),
  [8, 16, 32, 64, 128, 256],
);
