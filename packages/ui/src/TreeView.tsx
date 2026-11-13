import type { ArrayStep, TreeData } from "./trace";
import "./player.css";

const LEVEL = 64; // vertical distance between levels, px
const TOP = 26;   // room above the root for lifted nodes

/**
 * Binary trees. Each node's x comes from its in-order position and its y from its depth, so the
 * drawing is always a valid layout; positions are percentages, so no measuring is needed. Nodes are
 * keyed by id and their position animates, so swapping two subtrees makes them slide across.
 */
export function TreeView({ step }: { step: ArrayStep }) {
  const trees = step.trees ?? [];
  return (
    <div className={`fp-trees${trees.length > 1 ? " is-multi" : ""}`}>
      {trees.map((t, k) => <Tree key={t.label ?? k} tree={t} />)}
    </div>
  );
}

function Tree({ tree }: { tree: TreeData }) {
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const pos = new Map<string, { x: number; d: number }>();
  let order = 0, depth = 0;
  const walk = (id: string | null, d: number) => {
    if (!id || !byId.has(id) || pos.has(id)) return;
    const n = byId.get(id)!;
    walk(n.left, d + 1);
    pos.set(id, { x: order++, d });
    depth = Math.max(depth, d);
    walk(n.right, d + 1);
  };
  walk(tree.root, 0);
  const count = Math.max(order, 1);
  const xp = (id: string) => ((pos.get(id)!.x + 0.5) / count) * 100;
  const yp = (id: string) => TOP + pos.get(id)!.d * LEVEL + 20;
  const height = TOP + (depth + 1) * LEVEL + 18;
  const edges: { a: string; b: string }[] = [];
  for (const id of pos.keys()) {
    const n = byId.get(id)!;
    for (const c of [n.left, n.right]) if (c && pos.has(c)) edges.push({ a: id, b: c });
  }
  const labels = new Map<string, string[]>();
  for (const [name, id] of Object.entries(tree.pointers ?? {})) if (id && pos.has(id)) labels.set(id, [...(labels.get(id) ?? []), name]);
  const describe = [...pos.keys()].sort((a, b) => pos.get(a)!.d - pos.get(b)!.d || pos.get(a)!.x - pos.get(b)!.x).map((id) => byId.get(id)!.val).join(", ");

  return (
    <div className="fp-tree">
      {tree.label && <div className="fp-tree__label">{tree.label}</div>}
      <div className="fp-tree__scroll">
        <div className="fp-tree__canvas" style={{ height, minWidth: count * 40 }} role="img"
          aria-label={`${tree.label ? tree.label + ": " : ""}${pos.size ? `tree with nodes level by level ${describe}` : "empty tree"}`}>
          {pos.size === 0 && <span className="fp-empty">empty tree</span>}
          <svg className="fp-tree__edges" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            {edges.map(({ a, b }) => (
              <line key={`${a}-${b}`} x1={xp(a)} y1={yp(a)} x2={xp(b)} y2={yp(b)} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {[...pos.keys()].map((id) => {
            const n = byId.get(id)!;
            const tone = tree.tones?.[id];
            const note = tree.notes?.[id];
            const ptr = labels.get(id);
            return (
              <div className="fp-tnode" key={id} style={{ left: `${xp(id)}%`, top: yp(id) }}>
                <div className={`fp-cell fp-tnode__circle${tone ? ` fp-cell--${tone}` : ""}`}>
                  <span className="fp-val" key={String(n.val)}>{n.val}</span>
                </div>
                {(note || ptr) && (
                  <div className="fp-tnode__note">
                    {ptr && <span className="fp-tnode__ptr">{ptr.join(" · ")}</span>}
                    {note && <span>{note}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
