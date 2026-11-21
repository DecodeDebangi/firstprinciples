import { ArrayPlayer } from "@firstprinciples/ui";
import { buildApproaches, buildExample, buildFields, buildPrepare, searchApproaches, searchExample, searchFields, searchPrepare } from "./steps";

export default function Viz({ approach }: { approach: "build" | "search" }) {
  if (approach === "build") return <ArrayPlayer approach={buildApproaches.build} initialInput={buildExample} fields={buildFields} prepare={buildPrepare} />;
  return <ArrayPlayer approach={searchApproaches.search} initialInput={searchExample} fields={searchFields} prepare={searchPrepare} />;
}
