import { ArrayPlayer } from "@firstprinciples/ui";
import { approaches, example, fields, partApproaches, partExample, partFields, partPrepare, prepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof approaches | "part" }) {
  return approach === "part"
    ? <ArrayPlayer approach={partApproaches.part} initialInput={partExample} fields={partFields} prepare={partPrepare} />
    : <ArrayPlayer approach={approaches[approach]} initialInput={example} fields={fields} prepare={prepare} />;
}
