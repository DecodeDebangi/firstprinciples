import { ArrayPlayer } from "@firstprinciples/ui";
import { basicApproaches, basicExample, optApproaches, optExample, plainApproaches, ufFields, ufPrepare } from "./steps";

/** "chain" runs the plain version on links that build a long chain, to compare with "optimised" on the same links. */
export default function Viz({ approach }: { approach: "basic" | "chain" | "optimised" }) {
  if (approach === "basic") return <ArrayPlayer approach={basicApproaches.basic} initialInput={basicExample} fields={ufFields} prepare={ufPrepare} />;
  if (approach === "chain") return <ArrayPlayer approach={plainApproaches.basic} initialInput={optExample} fields={ufFields} prepare={ufPrepare} />;
  return <ArrayPlayer approach={optApproaches.optimised} initialInput={optExample} fields={ufFields} prepare={ufPrepare} />;
}
