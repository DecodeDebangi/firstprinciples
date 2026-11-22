import { ArrayPlayer } from "@firstprinciples/ui";
import { downApproaches, downExample, treeFields, treePrepare, upApproaches, upExample } from "./steps";

export default function Viz({ approach }: { approach: "up" | "down" }) {
  if (approach === "up") return <ArrayPlayer approach={upApproaches.up} initialInput={upExample} fields={treeFields} prepare={treePrepare} />;
  return <ArrayPlayer approach={downApproaches.down} initialInput={downExample} fields={treeFields} prepare={treePrepare} />;
}
