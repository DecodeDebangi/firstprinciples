import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { approaches, example, fields, prepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return <ArrayPlayer approach={approaches[approach]} initialInput={example} fields={fields} prepare={prepare} />;
}

/** Adding one character at a time against collecting and joining, on the same word. */
export function Compare() {
  return <ComparePlayer approaches={[approaches.concat, approaches.join]} initialInput={example} fields={fields} prepare={prepare} pair={[0, 1]} />;
}
