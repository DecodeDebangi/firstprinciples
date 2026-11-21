import { ArrayPlayer } from "@firstprinciples/ui";
import { countApproaches, countExample, countFields, countPrepare, groupApproaches, groupExample, groupFields, groupPrepare, sumApproaches, sumExample, sumFields, sumPrepare } from "./steps";

export default function Viz({ approach }: { approach: "count" | "group" | "prefixMap" }) {
  if (approach === "count") return <ArrayPlayer approach={countApproaches.count} initialInput={countExample} fields={countFields} prepare={countPrepare} />;
  if (approach === "group") return <ArrayPlayer approach={groupApproaches.group} initialInput={groupExample} fields={groupFields} prepare={groupPrepare} />;
  return <ArrayPlayer approach={sumApproaches.prefixMap} initialInput={sumExample} fields={sumFields} prepare={sumPrepare} />;
}
