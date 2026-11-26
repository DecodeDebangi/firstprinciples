import { ArrayPlayer } from "@firstprinciples/ui";
import { chain, middleIdx, sortedExample, sortedFields, sortedPrepare } from "./steps";
import { approaches as balance, example as balanceExample, fields as balanceFields, prepare as balancePrepare } from "../../dsa/0110-balanced-binary-tree/steps";

export default function Viz({ approach }: { approach: "chain" | "middle" | "check" }) {
  if (approach === "chain") return <ArrayPlayer approach={chain} initialInput={sortedExample} fields={sortedFields} prepare={sortedPrepare} />;
  if (approach === "middle") return <ArrayPlayer approach={middleIdx} initialInput={sortedExample} fields={sortedFields} prepare={sortedPrepare} />;
  return <ArrayPlayer approach={balance.bottomUp} initialInput={balanceExample} fields={balanceFields} prepare={balancePrepare} />;
}
