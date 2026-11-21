import { ArrayPlayer } from "@firstprinciples/ui";
import { nbrApproaches, nbrExample, nbrFields, nbrPrepare, trApproaches, trExample, trFields, trPrepare, walkApproaches, walkExample, walkFields, walkPrepare } from "./steps";

export default function Viz({ approach }: { approach: "walk" | "neighbours" | "transpose" }) {
  if (approach === "walk") return <ArrayPlayer approach={walkApproaches.walk} initialInput={walkExample} fields={walkFields} prepare={walkPrepare} />;
  if (approach === "neighbours") return <ArrayPlayer approach={nbrApproaches.neighbours} initialInput={nbrExample} fields={nbrFields} prepare={nbrPrepare} />;
  return <ArrayPlayer approach={trApproaches.transpose} initialInput={trExample} fields={trFields} prepare={trPrepare} />;
}
