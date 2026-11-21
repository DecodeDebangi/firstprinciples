import { ArrayPlayer } from "@firstprinciples/ui";
import { endsApproaches, endsExample, endsFields, endsPrepare, expApproaches, expExample, expFields, expPrepare } from "./steps";

export default function Viz({ approach }: { approach: "ends" | "expand" }) {
  if (approach === "ends") return <ArrayPlayer approach={endsApproaches.ends} initialInput={endsExample} fields={endsFields} prepare={endsPrepare} />;
  return <ArrayPlayer approach={expApproaches.expand} initialInput={expExample} fields={expFields} prepare={expPrepare} />;
}
