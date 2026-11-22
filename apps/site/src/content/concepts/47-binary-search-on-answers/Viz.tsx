import { ArrayPlayer } from "@firstprinciples/ui";
import { rowApproaches, rowExample, rowFields, rowPrepare, speedApproaches, speedExample, speedFields, speedPrepare } from "./steps";

export default function Viz({ approach }: { approach: "row" | "speed" }) {
  if (approach === "row") return <ArrayPlayer approach={rowApproaches.row} initialInput={rowExample} fields={rowFields} prepare={rowPrepare} />;
  return <ArrayPlayer approach={speedApproaches.speed} initialInput={speedExample} fields={speedFields} prepare={speedPrepare} />;
}
