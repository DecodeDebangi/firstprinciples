import { ArrayPlayer } from "@firstprinciples/ui";
import { lruApproaches, lruExample, lruFields, lruPrepare, unlinkApproaches, unlinkExample, unlinkFields, unlinkPrepare } from "./steps";

export default function Viz({ approach }: { approach: "unlink" | "lru" }) {
  return approach === "unlink"
    ? <ArrayPlayer approach={unlinkApproaches.unlink} initialInput={unlinkExample} fields={unlinkFields} prepare={unlinkPrepare} />
    : <ArrayPlayer approach={lruApproaches.lru} initialInput={lruExample} fields={lruFields} prepare={lruPrepare} />;
}
