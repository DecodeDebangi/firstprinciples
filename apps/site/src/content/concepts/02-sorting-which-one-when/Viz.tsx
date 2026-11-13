import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { approaches, example, fields, prepare } from "./steps";

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return <ArrayPlayer approach={approaches[approach]} initialInput={example} fields={fields} prepare={prepare} />;
}

/** Starts with bubble sort vs merge sort; readers can pick any two of the six. */
export function Compare() {
  const list = Object.values(approaches);
  return <ComparePlayer approaches={list} initialInput={example} fields={fields} prepare={prepare}
    pair={[list.indexOf(approaches.bubble), list.indexOf(approaches.merge)]} />;
}
