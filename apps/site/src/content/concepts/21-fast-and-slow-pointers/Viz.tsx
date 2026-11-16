import { ArrayPlayer } from "@firstprinciples/ui";
import { loopApproaches, loopExample, loopFields, loopPrepare, middleApproaches, middleExample, middleFields, middlePrepare } from "./steps";

export default function Viz({ approach }: { approach: "middle" | "loop" }) {
  return approach === "middle"
    ? <ArrayPlayer approach={middleApproaches.middle} initialInput={middleExample} fields={middleFields} prepare={middlePrepare} />
    : <ArrayPlayer approach={loopApproaches.loop} initialInput={loopExample} fields={loopFields} prepare={loopPrepare} />;
}
