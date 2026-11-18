import { ArrayPlayer } from "@firstprinciples/ui";
import { digitsApproaches, digitsExample, digitsFields, digitsPrepare, wrapApproaches, wrapExample, wrapFields, wrapPrepare } from "./steps";

export default function Viz({ approach }: { approach: "digits" | "wrap" }) {
  return approach === "digits"
    ? <ArrayPlayer approach={digitsApproaches.digits} initialInput={digitsExample} fields={digitsFields} prepare={digitsPrepare} />
    : <ArrayPlayer approach={wrapApproaches.wrap} initialInput={wrapExample} fields={wrapFields} prepare={wrapPrepare} />;
}
