import { ArrayPlayer } from "@firstprinciples/ui";
import { approaches, fields, sortExample, sortPrepare, splitExample, splitPrepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return approach === "split"
    ? <ArrayPlayer approach={approaches.split} initialInput={splitExample} fields={fields} prepare={splitPrepare} />
    : <ArrayPlayer approach={approaches.mergeSort} initialInput={sortExample} fields={fields} prepare={sortPrepare} />;
}
