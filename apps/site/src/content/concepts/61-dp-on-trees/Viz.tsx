import { ArrayPlayer } from "@firstprinciples/ui";
import { camExample, camGreedy, prepareUpTo, robExample, robPair, rootFields } from "./steps";

export default function Viz({ approach }: { approach: "pair" | "states" }) {
  if (approach === "pair") return <ArrayPlayer approach={robPair} initialInput={robExample} fields={rootFields} prepare={prepareUpTo(12)} />;
  return <ArrayPlayer approach={camGreedy} initialInput={camExample} fields={rootFields} prepare={prepareUpTo(12)} />;
}
