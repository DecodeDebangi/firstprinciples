import { ArrayPlayer } from "@firstprinciples/ui";
import * as stream from "../../dsa/1032-stream-of-characters/steps";
import * as enc from "../../dsa/0820-short-encoding-of-words/steps";

export default function Viz({ approach }: { approach: "stream" | "encoding" }) {
  if (approach === "stream") return <ArrayPlayer approach={stream.approaches.trie} initialInput={stream.example} fields={stream.fields} prepare={stream.prepare} />;
  return <ArrayPlayer approach={enc.approaches.trie} initialInput={enc.example} fields={enc.fields} prepare={enc.prepare} />;
}
