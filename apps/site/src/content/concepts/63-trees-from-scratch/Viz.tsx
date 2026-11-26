import { ArrayPlayer } from "@firstprinciples/ui";
import { fromList, height, listExample, parts, partsExample, treeFields, treePrepare } from "./steps";

export default function Viz({ approach }: { approach: "parts" | "height" | "list" }) {
  const a = { parts, height, list: fromList }[approach];
  return <ArrayPlayer approach={a} initialInput={approach === "list" ? listExample : partsExample} fields={treeFields} prepare={treePrepare} />;
}
