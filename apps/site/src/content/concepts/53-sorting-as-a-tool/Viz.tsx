import { ArrayPlayer } from "@firstprinciples/ui";
import { partitionApproaches, partitionExample, partitionFields, partitionPrepare, ruleApproaches, ruleExample, ruleFields, rulePrepare } from "./steps";

export default function Viz({ approach }: { approach: "rule" | "partition" }) {
  if (approach === "rule") return <ArrayPlayer approach={ruleApproaches.rule} initialInput={ruleExample} fields={ruleFields} prepare={rulePrepare} />;
  return <ArrayPlayer approach={partitionApproaches.partition} initialInput={partitionExample} fields={partitionFields} prepare={partitionPrepare} />;
}
