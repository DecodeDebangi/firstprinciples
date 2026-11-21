import { ArrayPlayer } from "@firstprinciples/ui";
import { keepApproaches, keepExample, keepFields, keepPrepare, revApproaches, revExample, revFields, revPrepare, rotApproaches, rotExample, rotFields, rotPrepare } from "./steps";

export default function Viz({ approach }: { approach: "keep" | "reverse" | "rotate" }) {
  if (approach === "keep") return <ArrayPlayer approach={keepApproaches.keep} initialInput={keepExample} fields={keepFields} prepare={keepPrepare} />;
  if (approach === "reverse") return <ArrayPlayer approach={revApproaches.reverse} initialInput={revExample} fields={revFields} prepare={revPrepare} />;
  return <ArrayPlayer approach={rotApproaches.rotate} initialInput={rotExample} fields={rotFields} prepare={rotPrepare} />;
}
