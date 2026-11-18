import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { approaches, example, fields, prepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return <ArrayPlayer approach={approaches[approach]} initialInput={example} fields={fields} prepare={prepare} />;
}

/** Looping over each range against one subtraction per range. */
export function Compare() {
  return <ComparePlayer approaches={[approaches.loopEach, approaches.withPrefix]} initialInput={example} fields={fields} prepare={prepare} pair={[0, 1]} />;
}
