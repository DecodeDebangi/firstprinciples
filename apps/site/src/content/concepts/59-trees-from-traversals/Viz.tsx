import { ArrayPlayer } from "@firstprinciples/ui";
import { buildFrom, examples, pairFields, pairPrepare } from "./steps";

export default function Viz({ approach }: { approach: "pre-in" | "pre-post" }) {
  return <ArrayPlayer approach={buildFrom(approach, true)} initialInput={examples[approach]} fields={pairFields(approach)} prepare={pairPrepare(approach)} />;
}
