import { ArrayPlayer, ComparePlayer } from "@firstprinciples/ui";
import { avlInserts, insertsExample, insertsFields, insertsPrepare, plainInserts } from "./steps";

const approaches = { plain: plainInserts, avl: avlInserts };

export default function Viz({ approach }: { approach: keyof typeof approaches }) {
  return <ArrayPlayer approach={approaches[approach]} initialInput={insertsExample} fields={insertsFields} prepare={insertsPrepare} />;
}

/** Plain BST inserts against AVL inserts, on the same values. */
export function Compare() {
  return <ComparePlayer approaches={Object.values(approaches)} initialInput={insertsExample} fields={insertsFields} prepare={insertsPrepare} />;
}
