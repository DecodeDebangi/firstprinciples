import { ArrayPlayer } from "@firstprinciples/ui";
import { lisApproaches, lisExample, lisFields, lisPrepare, robApproaches, robExample, robFields, robPrepare } from "./steps";

export default function Viz({ approach }: { approach: "takeSkip" | "endingHere" }) {
  if (approach === "takeSkip") return <ArrayPlayer approach={robApproaches.takeSkip} initialInput={robExample} fields={robFields} prepare={robPrepare} />;
  return <ArrayPlayer approach={lisApproaches.endingHere} initialInput={lisExample} fields={lisFields} prepare={lisPrepare} />;
}
