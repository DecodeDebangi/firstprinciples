import { ArrayPlayer } from "@firstprinciples/ui";
import { lcsApproaches, lcsExample, twoFields, twoPrepare } from "./steps";

export default function Viz(_: { approach: "lcs" }) {
  return <ArrayPlayer approach={lcsApproaches.lcs} initialInput={lcsExample} fields={twoFields} prepare={(r) => twoPrepare(r)} />;
}
