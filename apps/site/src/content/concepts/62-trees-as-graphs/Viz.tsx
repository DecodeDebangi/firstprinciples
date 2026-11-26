import { ArrayPlayer } from "@firstprinciples/ui";
import { distBfs, distExample, distFields, distPrepare } from "./steps";

export default function Viz() {
  return <ArrayPlayer approach={distBfs} initialInput={distExample} fields={distFields} prepare={distPrepare} />;
}
