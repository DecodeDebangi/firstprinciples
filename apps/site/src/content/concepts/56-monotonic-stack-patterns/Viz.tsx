import { ArrayPlayer } from "@firstprinciples/ui";
import { approaches, circExample, circPrepare, fields, histExample, histPrepare, spanExample, spanPrepare } from "./steps";

export default function Viz({ approach }: { approach: "span" | "circular" | "histogram" }) {
  if (approach === "span") return <ArrayPlayer approach={approaches.span} initialInput={spanExample} fields={fields} prepare={spanPrepare} />;
  if (approach === "circular") return <ArrayPlayer approach={approaches.circular} initialInput={circExample} fields={fields} prepare={circPrepare} />;
  return <ArrayPlayer approach={approaches.histogram} initialInput={histExample} fields={fields} prepare={histPrepare} />;
}
