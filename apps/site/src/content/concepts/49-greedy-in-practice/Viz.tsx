import { ArrayPlayer } from "@firstprinciples/ui";
import { gasExample, gasFields, gasPrepare, jumpExample, jumpFields, jumpPrepare, reachApproaches, tankApproaches } from "./steps";

export default function Viz({ approach }: { approach: "reach" | "tank" }) {
  if (approach === "reach") return <ArrayPlayer approach={reachApproaches.reach} initialInput={jumpExample} fields={jumpFields} prepare={jumpPrepare} />;
  return <ArrayPlayer approach={tankApproaches.tank} initialInput={gasExample} fields={gasFields} prepare={gasPrepare} />;
}
