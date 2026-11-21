import { ArrayPlayer } from "@firstprinciples/ui";
import { patApproaches, patExample, patFields, patPrepare, slotApproaches, slotExample, slotFields, slotPrepare } from "./steps";

export default function Viz({ approach }: { approach: "slots" | "pattern" }) {
  if (approach === "slots") return <ArrayPlayer approach={slotApproaches.slots} initialInput={slotExample} fields={slotFields} prepare={slotPrepare} />;
  return <ArrayPlayer approach={patApproaches.pattern} initialInput={patExample} fields={patFields} prepare={patPrepare} />;
}
