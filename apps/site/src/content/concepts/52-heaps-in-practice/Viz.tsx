import { ArrayPlayer } from "@firstprinciples/ui";
import { medianApproaches, medianExample, medianFields, medianPrepare, mergeApproaches, mergeExample, mergeFields, mergePrepare } from "./steps";

export default function Viz({ approach }: { approach: "merge" | "median" }) {
  if (approach === "merge") return <ArrayPlayer approach={mergeApproaches.merge} initialInput={mergeExample} fields={mergeFields} prepare={mergePrepare} />;
  return <ArrayPlayer approach={medianApproaches.median} initialInput={medianExample} fields={medianFields} prepare={medianPrepare} />;
}
