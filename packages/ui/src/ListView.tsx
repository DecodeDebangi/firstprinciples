import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [pos, setPos] = useState<Record<string, { x: number; w: number }>>({});
  const ids = row.nodes.map((n) => n.id).join("|");

  useIsoLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const out: Record<string, { x: number; w: number }> = {};
      el.querySelectorAll<HTMLElement>("[data-node]").forEach((n) => (out[n.dataset.node!] = { x: n.offsetLeft, w: n.offsetWidth }));
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
  const describe = row.nodes.map((n) => (n.kind === "null" ? "None" : String(n.val))).join(" → ");

  return (
    <div className="fp-lrow">
      {row.label && <div className="fp-lrow__label">{row.label}</div>}
      <div className="fp-ltrack" ref={trackRef}>
        <div className="fp-lnodes" role="img" aria-label={`${row.label ? row.label + ": " : ""}${describe}`}>
          {row.nodes.length === 0 && <span className="fp-empty">empty</span>}
          {row.nodes.map((n, i) => {
            const tone = row.tones?.[n.id];
            const arrow = row.arrows[i];
            return (
              <Fragment key={n.id}>
                <div data-node={n.id}
                  className={`fp-cell fp-lnode${n.kind ? ` is-${n.kind}` : ""}${tone ? ` fp-cell--${tone}` : ""}`}>
                  <span className="fp-val" key={String(n.val)}>{n.kind === "null" ? "None" : n.val}</span>
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
        <div className="fp-ptr-layer" style={{ height: rows * PTR_ROW + 10 }} aria-hidden="true">
          {ptrs.map(({ name, id, r }) => {
            const c = pos[id];
            if (!c) return null;
            return (
              <span className="fp-ptr" key={name} style={{ width: c.w, transform: `translate(${c.x}px, ${r * PTR_ROW}px)` }}>
                {name}
              </span>
            );
          })}
        </div>
        {ptrs.length > 0 && <span className="fp-sr">Pointers: {ptrs.map((p) => `${p.name} at ${p.id}`).join(", ")}</span>}
      </div>
    </div>
  );
}
