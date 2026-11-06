import { useEffect, useMemo, useState } from "react";
import { ArrayCells } from "./ArrayCells";
import { Tracer, type Approach } from "./trace";
import "./demo.css";

/**
 * A hands-off preview: plays an approach on a loop with no controls.
 * With reduced motion preferred, it waits for the visitor to press "Next step".
 */
export function AutoDemo<I>({ approach, input, title }: { approach: Approach<I>; input: I; title: string }) {
  const steps = useMemo(() => {
    const t = new Tracer();
    approach.run(input, t);
    return t.steps;
  }, [approach, input]);
  const [idx, setIdx] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const atEnd = idx === steps.length - 1;
    const id = setTimeout(() => setIdx(atEnd ? 0 : idx + 1), atEnd ? 3200 : 1700);
    return () => clearTimeout(id);
  }, [idx, steps.length, reduced]);

  const step = steps[idx];
  return (
    <div className="fp-demo">
      <div className="fp-demo__bar">
        <span className="fp-demo__dots" aria-hidden><i /><i /><i /></span>
        <span className="fp-demo__title">{title}</span>
        <span className="fp-demo__count">step {idx + 1}/{steps.length}</span>
      </div>
      <div className="fp-demo__body">
        <ArrayCells step={step} />
        <p className={`fp-demo__msg${step.done ? ` is-${step.done}` : ""}`} aria-live="polite">{step.message}</p>
        <div className="fp-demo__foot">
          <span>comparisons so far: <b>{step.ops}</b></span>
          {reduced && (
            <button type="button" onClick={() => setIdx((i) => (i + 1) % steps.length)}>Next step</button>
          )}
        </div>
      </div>
    </div>
  );
}
