import { ArrayPlayer } from "@firstprinciples/ui";
import { bstSerialExample, bstSerialPrepare, compact, levels, preorder, serialExample, serialFields, serialPrepare } from "./steps";

export default function Viz({ approach }: { approach: "levels" | "preorder" | "compact" }) {
  if (approach === "compact") return <ArrayPlayer approach={compact} initialInput={bstSerialExample} fields={serialFields} prepare={bstSerialPrepare} />;
  return <ArrayPlayer approach={approach === "levels" ? levels : preorder} initialInput={serialExample} fields={serialFields} prepare={serialPrepare} />;
}
