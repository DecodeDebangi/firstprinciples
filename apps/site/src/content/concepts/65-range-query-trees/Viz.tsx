import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { rangeApproaches, rangeExample, rangeFields, rangePrepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof rangeApproaches }) {
  return <ArrayPlayer approach={rangeApproaches[approach]} initialInput={rangeExample} fields={rangeFields} prepare={rangePrepare} />;
}

/** All three on the same values and operations. */
export function Compare() {
  return <ComparePlayer approaches={Object.values(rangeApproaches)} initialInput={rangeExample} fields={rangeFields} prepare={rangePrepare} />;
}
