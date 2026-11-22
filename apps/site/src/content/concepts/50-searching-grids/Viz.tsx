import { ArrayPlayer } from "@firstprinciples/ui";
import { areaApproaches, areaExample, areaFields, areaPrepare, layersApproaches, layersExample, layersFields, layersPrepare } from "./steps";

export default function Viz({ approach }: { approach: "layers" | "area" }) {
  if (approach === "layers") return <ArrayPlayer approach={layersApproaches.layers} initialInput={layersExample} fields={layersFields} prepare={layersPrepare} />;
  return <ArrayPlayer approach={areaApproaches.area} initialInput={areaExample} fields={areaFields} prepare={areaPrepare} />;
}
