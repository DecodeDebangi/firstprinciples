import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ArrayStep } from "./trace";
import "./player.css";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const PTR_ROW = 18;

/**
 * The array row: cells, indices (or labels) and pointer tags.
 * Pointers live in their own layer and are keyed by name, so when `lo` moves
 * from index 0 to 5 the same tag slides across instead of jumping.
 */
export function ArrayCells({ step }: { step: ArrayStep }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState<{ x: number; w: number }[]>([]);
  const n = step.array.length;

  useIsoLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const nodes = el.querySelectorAll<HTMLElement>(":scope > .fp-cells > .fp-col");
      setCols([...nodes].map((c) => ({ x: c.offsetLeft, w: c.offsetWidth })));
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

  return (
    <div className="fp-track" ref={trackRef}>
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
      <div className="fp-ptr-layer" style={{ height: rows * PTR_ROW + 4 }} aria-hidden="true">
        {ptrs.map(({ name, i, row }) => {
          const c = cols[i];
          if (!c) return null;
          return (
            <span className="fp-ptr" key={name}
              style={{ width: c.w, transform: `translate(${c.x}px, ${row * PTR_ROW}px)` }}>
              ↑ {name}
            </span>
          );
        })}
      </div>
      {ptrs.length > 0 && (
        <span className="fp-sr">Pointers: {ptrs.map((p) => `${p.name} at ${p.i}`).join(", ")}</span>
      )}
    </div>
  );
}
