import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { factApproaches, factExample, factFields, factPrepare, fibApproaches, fibExample, fibFields, fibPrepare } from "./steps";

export default function Viz({ approach }: { approach: "factorial" | keyof typeof fibApproaches }) {
  return approach === "factorial"
    ? <ArrayPlayer approach={factApproaches.factorial} initialInput={factExample} fields={factFields} prepare={factPrepare} />
    : <ArrayPlayer approach={fibApproaches[approach]} initialInput={fibExample} fields={fibFields} prepare={fibPrepare} />;
}

/** Plain recursion against the memo version, on the same n. */
export function Compare() {
  return <ComparePlayer approaches={[fibApproaches.fibPlain, fibApproaches.fibMemo]} initialInput={fibExample} fields={fibFields} prepare={fibPrepare} pair={[0, 1]} />;
}
