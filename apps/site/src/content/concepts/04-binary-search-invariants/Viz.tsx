import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { approaches, example, fields, prepare } from "./steps";
import * as bs from "../../dsa/0704-binary-search/steps";

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return <ArrayPlayer approach={approaches[approach]} initialInput={example} fields={fields} prepare={prepare} />;
}

/** Brute force vs optimal by default; the reader can pick any two. */
export function Compare() {
  return <ComparePlayer approaches={Object.values(approaches)} initialInput={example} fields={fields} prepare={prepare} />;
}

/** For the opening section: checking every item against the plain binary search loop, from LeetCode 704. */
export function Race() {
  const a = bs.approaches;
  return <ComparePlayer approaches={[a.linear, a.iterative]} initialInput={bs.example} fields={bs.fields} prepare={bs.prepare} />;
}
