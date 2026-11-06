import { useState } from "react";
import type { GrowthSeries } from "./trace";
import "./chart.css";

const W = 640, H = 300;
const M = { top: 16, right: 150, bottom: 40, left: 64 };
const PW = W - M.left - M.right, PH = H - M.top - M.bottom;

function niceStep(max: number, count = 4) {
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
}
const fmt = (v: number) => v.toLocaleString("en-US");

export function GrowthChart({ series, caption }: { series: GrowthSeries[]; caption?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const ns = series[0].points.map(([n]) => n);
  const xMax = ns[ns.length - 1];
  const yMaxRaw = Math.max(...series.flatMap((s) => s.points.map(([, v]) => v)));
  const step = niceStep(yMaxRaw);
  const yMax = Math.ceil(yMaxRaw / step) * step;
  const yTicks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);
  const x = (n: number) => M.left + (n / xMax) * PW;
  const y = (v: number) => M.top + PH - (v / yMax) * PH;

  // Direct labels at line ends, nudged apart so they never overlap.
  const ends = series
    .map((s, i) => ({ i, y: y(s.points[s.points.length - 1][1]) }))
    .sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) ends[k].y = Math.max(ends[k].y, ends[k - 1].y + 15);
  const labelY = Object.fromEntries(ends.map((e) => [e.i, e.y]));

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    ns.forEach((n, i) => { if (Math.abs(x(n) - px) < Math.abs(x(ns[best]) - px)) best = i; });
    setHover(best);
  }

  return (
    <figure className="fp-chart">
      <div className="fp-chart__legend">
        {series.map((s) => (
          <span key={s.name}><i style={{ background: `var(--series-${s.slot})` }} />{s.name}</span>
        ))}
      </div>
      <div className="fp-chart__plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img"
          aria-label={`Line chart of operations versus input size n for ${series.map((s) => s.name).join(", ")}. A table version follows.`}>
          {yTicks.map((t) => (
            <g key={t}>
              <line className="fp-chart__grid" x1={M.left} x2={M.left + PW} y1={y(t)} y2={y(t)} />
              <text className="fp-chart__tick" x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">{fmt(t)}</text>
            </g>
          ))}
          {ns.map((n) => (
            <text key={n} className="fp-chart__tick" x={x(n)} y={M.top + PH + 18} textAnchor="middle">{n}</text>
          ))}
          <text className="fp-chart__axis" x={M.left + PW / 2} y={H - 4} textAnchor="middle">input size n</text>
          <text className="fp-chart__axis" x={14} y={M.top + PH / 2} textAnchor="middle"
            transform={`rotate(-90 14 ${M.top + PH / 2})`}>operations</text>

          {series.map((s, i) => {
            const d = s.points.map(([n, v], k) => `${k ? "L" : "M"}${x(n)},${y(v)}`).join("");
            const [ln, lv] = s.points[s.points.length - 1];
            return (
              <g key={s.name}>
                <path d={d} fill="none" stroke={`var(--series-${s.slot})`} strokeWidth={2} strokeLinejoin="round" />
                <line className="fp-chart__leader" x1={x(ln) + 4} y1={y(lv)} x2={x(ln) + 10} y2={labelY[i]} />
                <text className="fp-chart__label" x={x(ln) + 12} y={labelY[i]} dominantBaseline="middle">{s.name}</text>
              </g>
            );
          })}

          {hover !== null && (
            <g pointerEvents="none">
              <line className="fp-chart__cross" x1={x(ns[hover])} x2={x(ns[hover])} y1={M.top} y2={M.top + PH} />
              {series.map((s) => (
                <circle key={s.name} cx={x(ns[hover])} cy={y(s.points[hover][1])} r={4.5}
                  fill={`var(--series-${s.slot})`} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect x={M.left} y={M.top} width={PW} height={PH} fill="transparent"
            onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {hover !== null && (
          <div className="fp-chart__tip" style={{
            left: `${(x(ns[hover]) / W) * 100}%`,
            transform: hover > ns.length / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}>
            <div className="fp-chart__tip-title">n = {ns[hover]}</div>
            {[...series].sort((a, b) => b.points[hover][1] - a.points[hover][1]).map((s) => (
              <div key={s.name} className="fp-chart__tip-row">
                <i style={{ background: `var(--series-${s.slot})` }} />
                <span>{s.name}</span><b>{fmt(s.points[hover][1])}</b>
              </div>
            ))}
          </div>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
      <details className="fp-chart__table">
        <summary>Show as a table</summary>
        <div className="fp-chart__scroll">
          <table>
            <thead><tr><th>n</th>{series.map((s) => <th key={s.name}>{s.name}</th>)}</tr></thead>
            <tbody>
              {ns.map((n, k) => (
                <tr key={n}><td>{n}</td>{series.map((s) => <td key={s.name}>{fmt(s.points[k][1])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
