import { ArrayPlayer } from "@firstprinciples/ui";
import { minApproaches, minExample, minPrepare, opsFields, queueApproaches, queueExample, queuePrepare, rpnApproaches, rpnExample, rpnFields, rpnPrepare } from "./steps";

export default function Viz({ approach }: { approach: "rpn" | "minStack" | "twoStacks" }) {
  if (approach === "rpn") return <ArrayPlayer approach={rpnApproaches.rpn} initialInput={rpnExample} fields={rpnFields} prepare={rpnPrepare} />;
  if (approach === "minStack") return <ArrayPlayer approach={minApproaches.minStack} initialInput={minExample} fields={opsFields} prepare={minPrepare} />;
  return <ArrayPlayer approach={queueApproaches.twoStacks} initialInput={queueExample} fields={opsFields} prepare={queuePrepare} />;
}
