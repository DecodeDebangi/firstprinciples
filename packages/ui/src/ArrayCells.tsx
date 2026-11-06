import type { ArrayStep } from "./trace";
import "./player.css";

/** The array row: cells, indices (or labels) and pointer tags for one step. */
export function ArrayCells({ step }: { step: ArrayStep }) {
  const pointersAt = (i: number) =>
    Object.entries(step.pointers ?? {}).filter(([, p]) => p === i).map(([name]) => name);
  return (
    <div className="fp-cells" role="img" aria-label={`Array: ${step.array.join(", ")}`}>
      {step.array.map((v, i) => {
        const outside = step.range ? i < step.range[0] || i > step.range[1] : false;
        const tone = step.tones?.[i] ?? (outside ? "discard" : undefined);
        return (
          <div className="fp-col" key={i}>
            <div className={`fp-cell${tone ? ` fp-cell--${tone}` : ""}`}>{v}</div>
            <div className="fp-idx">{step.labels?.[i] ?? i}</div>
            <div className="fp-ptrs">
              {pointersAt(i).map((p) => (
                <span className="fp-ptr" key={p}>↑ {p}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
