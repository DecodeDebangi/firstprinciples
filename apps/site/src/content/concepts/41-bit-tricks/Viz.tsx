import { ArrayPlayer } from "@firstprinciples/ui";
import { dropApproaches, dropExample, dropFields, dropPrepare, xorApproaches, xorExample, xorFields, xorPrepare } from "./steps";

export default function Viz({ approach }: { approach: "drop" | "xorAll" }) {
  if (approach === "drop") return <ArrayPlayer approach={dropApproaches.drop} initialInput={dropExample} fields={dropFields} prepare={dropPrepare} />;
  return <ArrayPlayer approach={xorApproaches.xorAll} initialInput={xorExample} fields={xorFields} prepare={xorPrepare} />;
}
