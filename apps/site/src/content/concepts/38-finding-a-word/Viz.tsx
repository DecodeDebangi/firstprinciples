import { ArrayPlayer } from "@firstprinciples/ui";
import { findFields, findPrepare, naiveApproaches, naiveExample, rollApproaches, rollExample } from "./steps";

export default function Viz({ approach }: { approach: "naive" | "rolling" }) {
  if (approach === "naive") return <ArrayPlayer approach={naiveApproaches.naive} initialInput={naiveExample} fields={findFields} prepare={findPrepare} />;
  return <ArrayPlayer approach={rollApproaches.rolling} initialInput={rollExample} fields={findFields} prepare={findPrepare} />;
}
