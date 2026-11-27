import { ArrayPlayer } from "@firstprinciples/ui";
import { compress, insertRadix, wordsExample, wordsFields, wordsPrepare } from "./steps";

export default function Viz({ approach }: { approach: "compress" | "insert" }) {
  return <ArrayPlayer approach={approach === "compress" ? compress : insertRadix} initialInput={wordsExample} fields={wordsFields} prepare={wordsPrepare} />;
}
