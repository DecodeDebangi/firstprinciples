import { ArrayPlayer } from "@firstprinciples/ui";
import { buildCounts, countPrefix, erase, eraseExample, eraseFields, erasePrepare, prefixExample, prefixFields, prefixPrepare, wordsExample, wordsFields, wordsPrepare } from "./steps";

export default function Viz({ approach }: { approach: "build" | "prefix" | "erase" }) {
  if (approach === "build") return <ArrayPlayer approach={buildCounts} initialInput={wordsExample} fields={wordsFields} prepare={wordsPrepare} />;
  if (approach === "prefix") return <ArrayPlayer approach={countPrefix} initialInput={prefixExample} fields={prefixFields} prepare={prefixPrepare} />;
  return <ArrayPlayer approach={erase} initialInput={eraseExample} fields={eraseFields} prepare={erasePrepare} />;
}
