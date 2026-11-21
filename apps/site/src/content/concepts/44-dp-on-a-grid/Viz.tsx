import { ArrayPlayer } from "@firstprinciples/ui";
import { gridFields, gridPrepare, recApproaches, recExample, tableApproaches, tableExample } from "./steps";

export default function Viz({ approach }: { approach: "recursion" | "table" }) {
  if (approach === "recursion") return <ArrayPlayer approach={recApproaches.recursion} initialInput={recExample} fields={gridFields} prepare={(r) => gridPrepare(r, 3)} />;
  return <ArrayPlayer approach={tableApproaches.table} initialInput={tableExample} fields={gridFields} prepare={(r) => gridPrepare(r, 5)} />;
}
