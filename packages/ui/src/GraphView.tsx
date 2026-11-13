import { useId } from "react";
import type { ArrayStep, GraphData } from "./trace";
import "./player.css";

const W = 160, H = 100; // viewBox units; the canvas keeps this 16:10 shape, so nothing is stretched
const M = 13;           // margin, so node circles stay inside

/** Where each node sits, in viewBox units. */
function place(g: GraphData) {
  const at = new Map<string, { x: number; y: number }>();
  const n = g.nodes.length;
  g.nodes.forEach((node, i) => {
    const p = g.pos?.[node.id];
    if (p) at.set(node.id, { x: M + p.x * (W - 2 * M), y: M + p.y * (H - 2 * M) });
    else {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
      at.set(node.id, n === 1 ? { x: W / 2, y: H / 2 } : { x: W / 2 + (W / 2 - M - 4) * Math.cos(angle), y: H / 2 + (H / 2 - M) * Math.sin(angle) });
    }
  });
  return at;
}

/**
 * Graphs: nodes on a circle (or at given positions) joined by edges. Directed edges carry an arrow at their middle,
 * so arrowheads never hide under a node. Node tones, notes and pointer labels work like TreeView's.
 */
export function GraphView({ step }: { step: ArrayStep }) {
  return <div className="fp-graphs">{(step.graphs ?? []).map((g, k) => <Graph key={k} g={g} />)}</div>;
}

function Graph({ g }: { g: GraphData }) {
  const uid = useId().replace(/:/g, "");
  const at = place(g);
  const labels = new Map<string, string[]>();
  for (const [name, id] of Object.entries(g.pointers ?? {})) if (id && at.has(id)) labels.set(id, [...(labels.get(id) ?? []), name]);
  const describe = g.edges.map((e) => `${g.nodes.find((n) => n.id === e.a)?.label}${g.directed ? "→" : "–"}${g.nodes.find((n) => n.id === e.b)?.label}`).join(", ");
  return (
    <div className="fp-graph" role="img" aria-label={`Graph with ${g.nodes.length} nodes and edges ${describe || "none"}`}>
      <svg className="fp-graph__edges" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {g.directed && (
          <defs>
            <marker id={`arrow-${uid}`} viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="5.5" markerHeight="5.5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" className="fp-graph__arrow" />
            </marker>
          </defs>
        )}
        {g.edges.map((e) => {
          const a = at.get(e.a), b = at.get(e.b);
          if (!a || !b) return null;
          const tone = g.edgeTones?.[`${e.a}>${e.b}`];
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          return (
            <polyline key={`${e.a}>${e.b}`} className={`fp-gedge${tone ? ` fp-gedge--${tone}` : ""}`}
              points={`${a.x},${a.y} ${mid.x},${mid.y} ${b.x},${b.y}`} markerMid={g.directed ? `url(#arrow-${uid})` : undefined} />
          );
        })}
      </svg>
      {g.nodes.map((node) => {
        const p = at.get(node.id)!;
        const tone = g.tones?.[node.id];
        const note = g.notes?.[node.id];
        const ptr = labels.get(node.id);
        return (
          <div className="fp-tnode" key={node.id} style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}>
            <div className={`fp-cell fp-tnode__circle${tone ? ` fp-cell--${tone}` : ""}`}><span className="fp-val">{node.label}</span></div>
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
  );
}

/** A 2D board of cells (a map, a maze, a game grid) as the main view. Tones are keyed "r,c". */
export function BoardView({ step }: { step: ArrayStep }) {
  const b = step.board!;
  return (
    <div className="fp-board" role="img" aria-label={`Board: ${b.rows.map((r) => r.join(" ")).join(" / ")}`}>
      {b.rows.map((row, r) => (
        <div className="fp-board__row" key={r}>
          {row.map((v, c) => {
            const tone = b.tones?.[`${r},${c}`];
            return <span key={c} className={`fp-gcell fp-bcell${tone ? ` fp-cell--${tone}` : ""}`}>{v}</span>;
          })}
        </div>
      ))}
    </div>
  );
}
