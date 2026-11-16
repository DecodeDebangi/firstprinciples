import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ArrayStep, ListRow } from "./trace";
import "./player.css";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PTR_ROW = 18;

/**
 * Linked lists, one row per list: nodes in order with the `next` arrow drawn between
 * neighbours (→ forward, ← reversed, nothing = no link). Same tones and lift as array
 * cells; pointers (prev, curr, tail…) ride a rail and slide between nodes.
 */
export function ListView({ step }: { step: ArrayStep }) {
  const rows = step.lists ?? [];
  // When any row has a label, all rows share one label column, so their nodes line up (l1 above l2 above sum).
  const labelled = rows.some((r) => r.label);
  return (
    <div className={`fp-lists${labelled ? " is-labelled" : ""}`}>
      {rows.map((row, k) => <Row key={row.label ?? k} row={row} labelled={labelled} />)}
    </div>
  );
}

function Row({ row, labelled }: { row: ListRow; labelled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, { x: number; w: number; top: number; h: number }>>({});
  const markId = useId();
  const ids = row.nodes.map((n) => n.id).join("|");

  useIsoLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const out: Record<string, { x: number; w: number; top: number; h: number }> = {};
      el.querySelectorAll<HTMLElement>("[data-node]").forEach((n) => (out[n.dataset.node!] = { x: n.offsetLeft, w: n.offsetWidth, top: n.offsetTop, h: n.offsetHeight }));
      setPos(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ids]);

  // Each label takes the first rail row where it doesn't overlap a label already placed, so two pointers on the
  // same node, or long names on neighbouring nodes ("evenHead", "even"), stack instead of running together.
  const CH = 7.4; // width of one 12px mono character
  const ends: number[] = [];
  const seen = new Set<string>(); // nodes that already have a label: a second label on one node needs no second triangle
  const ptrs = Object.entries(row.pointers ?? {})
    .filter(([, id]) => id != null && row.nodes.some((n) => n.id === id))
    .map(([name, id], k) => ({ name, id: id!, k, mid: pos[id!] ? pos[id!].x + pos[id!].w / 2 : row.nodes.findIndex((n) => n.id === id) * 1000 }))
    .sort((a, b) => a.mid - b.mid || a.k - b.k)
    .map((p) => {
      const w = Math.max(pos[p.id]?.w ?? 0, p.name.length * CH);
      const repeat = seen.has(p.id); seen.add(p.id);
      const left = Math.max(0, p.mid - w / 2); // a wide label on the first node stays inside the row
      let r = 0;
      while (ends[r] !== undefined && ends[r] > left - 4) r++;
      ends[r] = left + w;
      return { name: p.name, id: p.id, r, w, left, under: repeat };
    });
  const rows = Math.max(1, ...ptrs.map((p) => p.r + 1));
  const name = (id: string) => { const n = row.nodes.find((x) => x.id === id); return n ? (n.kind === "null" ? "none" : String(n.val)) : id; };
  const describe = row.nodes.map((n) => (n.kind === "null" ? "none" : String(n.val))).join(" → ")
    + (row.skips?.length ? `. Also: ${row.skips.map((s) => `${name(s.from)} points to ${name(s.to)}`).join(", ")}` : "");

  return (
    <div className={`fp-lrow${row.compact ? " is-compact" : ""}`}>
      {labelled && <div className="fp-lrow__label">{row.label ?? ""}</div>}
      <div className={`fp-ltrack${row.skips?.length ? " has-skips" : ""}`} ref={trackRef}>
        {row.skips?.length ? (
          <svg className="fp-lskips" aria-hidden="true">
            <defs>
              <marker id={markId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" />
              </marker>
            </defs>
            {row.skips.map(({ from, to, tone }) => {
              const a = pos[from], b = pos[to];
              if (!a || !b) return null;
              if (from === to) { // a node pointing at itself: a small loop over its top
                const cx = a.x + a.w / 2, y = a.top - 1;
                return <path key={`${from}>${to}`} className={tone ? `is-${tone}` : undefined} markerEnd={`url(#${markId})`}
                  d={`M ${cx + 8} ${y + 2} C ${cx + 40} ${y - 34}, ${cx - 40} ${y - 34}, ${cx - 8} ${y}`} />;
              }
              const x1 = a.x + a.w / 2, x2 = b.x + b.w * 0.35, y1 = a.top - 2, y2 = b.top - 2;
              const up = Math.min(30, 16 + Math.abs(x2 - x1) / 10);
              return <path key={`${from}>${to}`} className={tone ? `is-${tone}` : undefined} markerEnd={`url(#${markId})`}
                d={`M ${x1} ${y1} C ${x1} ${y1 - up}, ${x2} ${y2 - up}, ${x2} ${y2 - 2}`} />;
            })}
          </svg>
        ) : null}
        <div className="fp-lnodes" role="img" aria-label={`${row.label ? row.label + ": " : ""}${describe}`}>
          {row.nodes.length === 0 && <span className="fp-empty">empty</span>}
          {row.nodes.map((n, i) => {
            const tone = row.tones?.[n.id];
            const arrow = row.arrows[i];
            return (
              <Fragment key={n.id}>
                <div data-node={n.id}
                  className={`fp-cell fp-lnode${n.kind ? ` is-${n.kind}` : ""}${tone ? ` fp-cell--${tone}` : ""}`}>
                  <span className="fp-val" key={String(n.val)}>{n.kind === "null" ? "none" : n.val}</span>
                </div>
                {i < row.nodes.length - 1 && (
                  <span className={`fp-larrow${arrow ? ` is-${arrow}` : " is-none"}`} aria-hidden="true">
                    <svg viewBox="0 0 34 14" height="14" preserveAspectRatio="none">
                      {arrow && <line x1="3" y1="7" x2="31" y2="7" />}
                      {(arrow === "right" || arrow === "both" || arrow === "double") && <path d="M24 2 L31 7 L24 12" />}
                      {(arrow === "left" || arrow === "both" || arrow === "double") && <path d="M10 2 L3 7 L10 12" />}
                    </svg>
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
        {(ptrs.length > 0 || !row.compact) && <div className="fp-ptr-layer" style={{ height: rows * PTR_ROW + 10 }} aria-hidden="true">
          {ptrs.map(({ name, id, r, w, left, under }) => {
            const c = pos[id];
            if (!c) return null;
            return (
              <span className={`fp-ptr${under ? " is-stacked" : ""}`} key={name} style={{ width: w, transform: `translate(${left}px, ${r * PTR_ROW}px)`, ["--tip" as string]: `${c.x + c.w / 2 - left}px` }}>
                {name}
              </span>
            );
          })}
        </div>}
        {ptrs.length > 0 && <span className="fp-sr">Pointers: {ptrs.map((p) => `${p.name} at ${p.id}`).join(", ")}</span>}
      </div>
    </div>
  );
}
