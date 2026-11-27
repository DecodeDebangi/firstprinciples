import { ArrayPlayer } from "@firstprinciples/ui";
import { bestPartner, buildBits, numsExample, numsFields, numsPrepare, queryExample, queryFields, queryPrepare } from "./steps";

export default function Viz({ approach }: { approach: "build" | "best" }) {
  if (approach === "build") return <ArrayPlayer approach={buildBits} initialInput={numsExample} fields={numsFields} prepare={numsPrepare} />;
  return <ArrayPlayer approach={bestPartner} initialInput={queryExample} fields={queryFields} prepare={queryPrepare} />;
}
