import { AutoDemo } from "@firstprinciples/ui";
import { approaches, example } from "../content/dsa/0704-binary-search/steps";

export default function HeroDemo() {
  return <AutoDemo approach={approaches.iterative} input={example} title={`binary search · looking for ${example.target}`} />;
}
