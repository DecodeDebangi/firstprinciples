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
  return (
    <div className="fp-lists">
      {(step.lists ?? []).map((row, k) => <Row key={row.label ?? k} row={row} />)}
    </div>
  );
}

function Row({ row }: { row: ListRow }) {
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

  const rowAt = new Map<string, number>();
  const ptrs = Object.entries(row.pointers ?? {})
    .filter(([, id]) => id != null && row.nodes.some((n) => n.id === id))
    .map(([name, id]) => {
      const r = rowAt.get(id!) ?? 0;
      rowAt.set(id!, r + 1);
      return { name, id: id!, r };
    });
  const rows = Math.max(1, ...ptrs.map((p) => p.r + 1));
  const name = (id: string) => { const n = row.nodes.find((x) => x.id === id); return n ? (n.kind === "null" ? "none" : String(n.val)) : id; };
  const describe = row.nodes.map((n) => (n.kind === "null" ? "none" : String(n.val))).join(" → ")
    + (row.skips?.length ? `. Also: ${row.skips.map((s) => `${name(s.from)} points to ${name(s.to)}`).join(", ")}` : "");

  return (
    <div className={`fp-lrow${row.compact ? " is-compact" : ""}`}>
      {row.label && <div className="fp-lrow__label">{row.label}</div>}
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
                      {(arrow === "right" || arrow === "both") && <path d="M24 2 L31 7 L24 12" />}
                      {(arrow === "left" || arrow === "both") && <path d="M10 2 L3 7 L10 12" />}
                    </svg>
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
        {(ptrs.length > 0 || !row.compact) && <div className="fp-ptr-layer" style={{ height: rows * PTR_ROW + 10 }} aria-hidden="true">
          {ptrs.map(({ name, id, r }) => {
            const c = pos[id];
            if (!c) return null;
            return (
              <span className="fp-ptr" key={name} style={{ width: c.w, transform: `translate(${c.x}px, ${r * PTR_ROW}px)` }}>
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
