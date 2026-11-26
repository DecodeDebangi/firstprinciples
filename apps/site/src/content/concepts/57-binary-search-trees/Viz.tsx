import { ArrayPlayer } from "@firstprinciples/ui";
import { deletePrepare, deleteExample, deleteFields, insertExample, insertFields, insertPrepare, insertRecursive, remove, search, searchExample, searchFields, searchPrepare, succExample, succFields, succPrepare, successor } from "./steps";

export default function Viz({ approach }: { approach: "search" | "insert" | "delete" | "successor" }) {
  if (approach === "search") return <ArrayPlayer approach={search} initialInput={searchExample} fields={searchFields} prepare={searchPrepare} />;
  if (approach === "insert") return <ArrayPlayer approach={insertRecursive} initialInput={insertExample} fields={insertFields} prepare={insertPrepare} />;
  if (approach === "delete") return <ArrayPlayer approach={remove} initialInput={deleteExample} fields={deleteFields} prepare={deletePrepare} />;
  return <ArrayPlayer approach={successor} initialInput={succExample} fields={succFields} prepare={succPrepare} />;
}
