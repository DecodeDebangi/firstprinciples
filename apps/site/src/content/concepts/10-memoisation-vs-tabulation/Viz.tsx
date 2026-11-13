import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { approaches, example, fields, prepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return <ArrayPlayer approach={approaches[approach]} initialInput={example} fields={fields} prepare={prepare} />;
}

/** Starts with plain recursion vs the memo version. */
export function Compare() {
  return <ComparePlayer approaches={Object.values(approaches)} initialInput={example} fields={fields} prepare={prepare} pair={[0, 1]} />;
}
