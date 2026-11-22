import { ArrayPlayer } from "@firstprinciples/ui";
import { budgetApproaches, budgetExample, budgetFields, budgetPrepare, shortApproaches, shortExample, shortFields, shortPrepare } from "./steps";

export default function Viz({ approach }: { approach: "budget" | "shortest" }) {
  if (approach === "budget") return <ArrayPlayer approach={budgetApproaches.budget} initialInput={budgetExample} fields={budgetFields} prepare={budgetPrepare} />;
  return <ArrayPlayer approach={shortApproaches.shortest} initialInput={shortExample} fields={shortFields} prepare={shortPrepare} />;
}
