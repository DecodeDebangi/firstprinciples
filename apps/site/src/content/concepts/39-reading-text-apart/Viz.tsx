import { ArrayPlayer } from "@firstprinciples/ui";
import { numApproaches, numExample, numFields, numPrepare, splitApproaches, splitExample, splitFields, splitPrepare } from "./steps";

export default function Viz({ approach }: { approach: "split" | "parse" }) {
  if (approach === "split") return <ArrayPlayer approach={splitApproaches.split} initialInput={splitExample} fields={splitFields} prepare={splitPrepare} />;
  return <ArrayPlayer approach={numApproaches.parse} initialInput={numExample} fields={numFields} prepare={numPrepare} />;
}
