import { ArrayPlayer } from "@firstprinciples/ui";
import { removeApproaches, removeExample, removeFields, removePrepare, sumApproaches, sumExample, sumFields, sumPrepare } from "./steps";

export default function Viz({ approach }: { approach: "sum" | "remove" }) {
  return approach === "sum"
    ? <ArrayPlayer approach={sumApproaches.sum} initialInput={sumExample} fields={sumFields} prepare={sumPrepare} />
    : <ArrayPlayer approach={removeApproaches.remove} initialInput={removeExample} fields={removeFields} prepare={removePrepare} />;
}
