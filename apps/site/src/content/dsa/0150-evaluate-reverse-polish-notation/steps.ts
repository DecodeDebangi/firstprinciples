import { measureGrowth, type Approach, type InputField, type Prepared } from "@firstprinciples/ui";
import { parseTokens, rpnCode, rpnFields, rpnPrepare, rpnSteps, type RpnInput } from "../../concepts/46-stack-patterns/steps";

export type Input = RpnInput;
export const example: Input = { tokens: "3 4 2 * + 6 2 / -" };
export const fields: InputField[] = rpnFields;
export const prepare: (raw: Input) => Prepared<Input> = rpnPrepare;
const isOp = (x: string) => ["+", "-", "*", "/"].includes(x);
const apply = (op: string, a: number, b: number) => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : Math.trunc(a / b));

const collapse: Approach<Input> = {
  id: "collapse",
  name: "Collapse the first operator, repeat",
  code: `function evalRPN(tokens)
    while length(tokens) > 1
        i ← position of the first operator
        a, b ← tokens[i - 2], tokens[i - 1]
        r ← a op b  // op is tokens[i]
        replace tokens[i - 2..i] with r
    return tokens[0]
`,
  run({ tokens }, t) {
    let tk: string[] = parseTokens(tokens);
    t.step({ line: 2, array: [...tk], vars: { tokens: tk.length },
      message: `The first operator always applies to the two numbers just before it. Work it out, put the result in their place, and start again from the left.` });
    let asked = false;
    while (tk.length > 1) {
      const i = tk.findIndex(isOp);
      t.op(i + 1);
      const a = Number(tk[i - 2]), b = Number(tk[i - 1]), r = apply(tk[i], a, b);
      const ask = !asked ? (asked = true, { ask: { q: `The first operator is "${tk[i]}" at position ${i}. What does it combine?`, options: [`${a} ${tk[i]} ${b}: the two tokens just before it`, "The first two tokens of the list", "The two tokens after it"], answer: 0 } }) : {};
      t.step({ ...ask, line: 5, array: [...tk], range: [i - 2, i], tones: { [i - 2]: "compare", [i - 1]: "compare", [i]: "active" }, vars: { i, result: r },
        message: `The first operator is "${tk[i]}" at position ${i}: ${a} ${tk[i]} ${b} = ${r}. Finding it took ${i + 1} looks from the left.` });
      t.op(tk.length - i);
      tk = [...tk.slice(0, i - 2), String(r), ...tk.slice(i + 1)];
      t.step({ line: 6, array: [...tk], tones: { [i - 2]: "found" }, vars: { tokens: tk.length },
        message: `Replace the three tokens with ${r}, shifting everything after it left. ${tk.length} token${tk.length === 1 ? "" : "s"} left.` });
    }
    t.step({ line: 7, array: [...tk], tones: { 0: "settled" }, vars: { answer: Number(tk[0]) }, done: "found",
      message: `One token is left: ${tk[0]}. Each of the up to n / 2 operators cost a scan from the left and a shift: O(n²).` });
  },
};

const stack: Approach<Input> = { id: "stack", name: "Evaluate with a stack", code: rpnCode, run({ tokens }, t) { rpnSteps(tokens, t, { push: 5, pop: 8, done: 9 }); } };

export const approaches = { collapse, stack };

/** n numbers followed by n − 1 pluses: every collapse happens at the far end. */
export const growth = measureGrowth(
  [{ approach: collapse, slot: 1 }, { approach: stack, slot: 3 }],
  (n) => ({ tokens: [...Array.from({ length: n }, (_, i) => String((i % 9) + 1)), ...Array(n - 1).fill("+")].join(" ") }),
  [4, 8, 16, 24, 32],
);
