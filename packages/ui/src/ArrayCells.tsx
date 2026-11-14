import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ArrayStep } from "./trace";
import "./player.css";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PTR_ROW = 18;

type Geo = { x: number; w: number; top: number; h: number };

/**
 * The array row in the "lift and settle" style: the cell being examined lifts off the
 * page, ruled-out cells sink and grey out, and the range still in play sits on a shelf
 * that shrinks. Pointers ride a rail underneath and slide between cells (they're keyed
 * by name, so `lo` moving from 0 to 5 is one element gliding across).
 */
export function ArrayCells({ step }: { step: ArrayStep }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState<Geo[]>([]);
  const n = step.array.length;

  useIsoLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const nodes = el.querySelectorAll<HTMLElement>(":scope > .fp-cells > .fp-col");
      setCols([...nodes].map((c) => {
        const cell = c.querySelector<HTMLElement>(".fp-cell")!;
        // Columns and cells are both positioned relative to the track (the nearest positioned ancestor).
        return { x: c.offsetLeft, w: c.offsetWidth, top: cell.offsetTop, h: cell.offsetHeight };
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  // Stack pointers that share an index (lo = mid = hi) instead of overlapping them.
  const rowAt = new Map<number, number>();
  const ptrs = Object.entries(step.pointers ?? {})
    .filter(([, i]) => i >= 0 && i < n)
    .map(([name, i]) => {
      const row = rowAt.get(i) ?? 0;
      rowAt.set(i, row + 1);
      return { name, i, row };
    });
  const rows = Math.max(1, ...ptrs.map((p) => p.row + 1));

  // The shelf spans the range still in play.
  const r = step.range;
  const a = r ? cols[r[0]] : undefined, b = r ? cols[r[1]] : undefined;
  const shelf = a && b ? { left: a.x - 3, width: b.x + b.w - a.x + 6, top: a.top - 6, height: a.h + 12 } : null;

  const badgeCol = step.badge ? cols[step.badge.at] : undefined;
  const arrowId = useId();
  const mv = step.move, from = mv ? cols[mv.from] : undefined, to = mv ? cols[mv.to] : undefined;
  // Highlighted cells lift by up to 14px, so the arc starts and ends above that.
  const lift = from && to ? Math.min(34, 20 + Math.abs(to.x - from.x) / 12) : 0;

  return (
    <div className="fp-track" ref={trackRef}>
      <div className={`fp-shelf${shelf ? "" : " is-off"}`} aria-hidden="true"
        style={shelf ? { transform: `translateX(${shelf.left}px)`, width: shelf.width, top: shelf.top, height: shelf.height } : undefined} />
      <div className="fp-cells" role="img" aria-label={`Array: ${step.array.join(", ")}`}>
        {step.array.map((v, i) => {
          const outside = step.range ? i < step.range[0] || i > step.range[1] : false;
          const tone = step.tones?.[i] ?? (outside ? "discard" : undefined);
          return (
            <div className="fp-col" key={i}>
              <div className={`fp-cell${tone ? ` fp-cell--${tone}` : ""}`}>
                {/* Keyed by value: a changed digit re-mounts and pops. */}
                <span className="fp-val" key={String(v)}>{v}</span>
              </div>
              <div className="fp-idx">{step.labels?.[i] ?? i}</div>
            </div>
          );
        })}
      </div>
      {mv && from && to && (
        <>
          {/* Keyed by the move and the array, so the arrow redraws and the value slides again on every step. */}
          <svg className="fp-move" key={`arc-${mv.from}-${mv.to}-${step.array.join()}`} aria-hidden="true">
            <defs>
              <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" />
              </marker>
            </defs>
            <path pathLength={1} markerEnd={`url(#${arrowId})`}
              d={`M ${from.x + from.w / 2} ${from.top - 14} C ${from.x + from.w / 2} ${from.top - 14 - lift}, ${to.x + to.w / 2} ${to.top - 18 - lift}, ${to.x + to.w / 2} ${to.top - 20}`} />
          </svg>
          <span className="fp-ghost" key={`ghost-${mv.from}-${mv.to}-${step.array.join()}`} aria-hidden="true"
            style={{ left: from.x + (from.w - to.w) / 2, top: from.top, width: to.w, height: to.h, ["--dx" as string]: `${to.x - from.x}px` }}>
            {step.array[mv.to]}
          </span>
        </>
      )}
      {step.badge && badgeCol && (
        <div key={`${step.badge.at}-${step.badge.text}`}
          className={`fp-badge${step.badge.at <= 1 ? " is-start" : step.badge.at >= n - 2 ? " is-end" : ""}`}
          style={{
            left: step.badge.at <= 1 ? badgeCol.x : step.badge.at >= n - 2 ? badgeCol.x + badgeCol.w : badgeCol.x + badgeCol.w / 2,
            top: Math.max(0, badgeCol.top - 40),
          }}>
          {step.badge.text}
        </div>
      )}
      <div className="fp-ptr-layer" style={{ height: rows * PTR_ROW + 10 }} aria-hidden="true">
        {ptrs.map(({ name, i, row }) => {
          const c = cols[i];
          if (!c) return null;
          return (
            <span className="fp-ptr" key={name}
              style={{ width: c.w, transform: `translate(${c.x}px, ${row * PTR_ROW}px)` }}>
              {name}
            </span>
          );
        })}
      </div>
      {(ptrs.length > 0 || step.badge || mv) && (
        <span className="fp-sr">
          {mv ? `${step.array[mv.to]} copied from position ${mv.from} to position ${mv.to}. ` : ""}
          {step.badge ? `${step.badge.text}. ` : ""}
          {ptrs.length > 0 ? `Pointers: ${ptrs.map((p) => `${p.name} at ${p.i}`).join(", ")}` : ""}
        </span>
      )}
    </div>
  );
}
