import { ArrayPlayer } from "@firstprinciples/ui";
import { binApproaches, binExample, binFields, binPrepare, opApproaches, opExample, opFields, opPrepare } from "./steps";

export default function Viz({ approach }: { approach: "toBinary" | "combine" }) {
  if (approach === "toBinary") return <ArrayPlayer approach={binApproaches.toBinary} initialInput={binExample} fields={binFields} prepare={binPrepare} />;
  return <ArrayPlayer approach={opApproaches.combine} initialInput={opExample} fields={opFields} prepare={opPrepare} />;
}
