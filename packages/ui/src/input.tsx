import { useEffect, useState } from "react";

export type InputValues = Record<string, number | number[] | string | (number | null)[]>;

export interface InputField {
  key: string;
  label: string;
  /** "tree" = a level-order list where `null` marks a missing child, as LeetCode writes trees. */
  kind: "numbers" | "number" | "text" | "tree";
  hint?: string;
}

export type Prepared<I> = { input: I; note?: string } | { error: string };

export function toText(v: number | number[] | string | (number | null)[]) {
  return Array.isArray(v) ? v.map((x) => (x === null ? "null" : x)).join(", ") : String(v);
}

export function parseDraft(fields: InputField[], draft: Record<string, string>, maxLength: number): { raw: InputValues } | { error: string } {
  const raw: InputValues = {};
  for (const f of fields) {
    const text = (draft[f.key] ?? "").trim();
    if (f.kind === "text") {
      const compact = text.replace(/\s+/g, "");
      if (compact.length > maxLength) return { error: `${f.label} can be at most ${maxLength} characters so the animation fits.` };
      raw[f.key] = compact;
    } else if (f.kind === "tree") {
      const parts = text.split(/[\s,]+/).filter(Boolean);
      const vals = parts.map((p) => (/^(null|none|_|-)$/i.test(p) ? null : Number(p)));
      if (vals.some((v) => v !== null && !Number.isInteger(v)))
        return { error: `${f.label} must be whole numbers or null, separated by commas (LeetCode's level order).` };
      if (vals.length && vals[0] === null) return { error: `${f.label} can't start with null: the first value is the root.` };
      if (vals.filter((v) => v !== null).length > 15) return { error: `${f.label} can have at most 15 nodes so the tree fits.` };
      raw[f.key] = vals;
    } else if (f.kind === "number") {
      const n = Number(text);
      if (text === "" || !Number.isInteger(n)) return { error: `${f.label} must be a whole number.` };
      raw[f.key] = n;
    } else {
      const parts = text.split(/[\s,]+/).filter(Boolean);
      const nums = parts.map(Number);
      if (parts.length === 0 || nums.some((n) => !Number.isInteger(n))) return { error: `${f.label} must be whole numbers separated by commas.` };
      if (nums.length > maxLength) return { error: `${f.label} can have at most ${maxLength} numbers so the animation fits.` };
      raw[f.key] = nums;
    }
  }
  return { raw };
}

/** The "Try your own input" form, shared by the single player and the compare view. */
export function InputForm<I extends InputValues>({ fields, initialInput, shown, prepare, maxLength = 14, onApply }: {
  fields: InputField[];
  initialInput: I;
  /** The input currently running, if different from the example (e.g. opened from a shared link). */
  shown?: I;
  prepare?: (raw: I) => Prepared<I>;
  maxLength?: number;
  onApply: (input: I) => void;
}) {
  const fresh = (inp: I) => Object.fromEntries(fields.map((f) => [f.key, toText(inp[f.key])]));
  const [draft, setDraft] = useState<Record<string, string>>(() => fresh(shown ?? initialInput));
  const [msg, setMsg] = useState<{ kind: "error" | "note"; text: string } | null>(null);
  // Follow the running input when it changes from outside (e.g. a shared link), without losing messages.
  const shownKey = JSON.stringify(shown ?? null);
  useEffect(() => { if (shown) setDraft(fresh(shown)); }, [shownKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function apply(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseDraft(fields, draft, maxLength);
    if ("error" in parsed) return setMsg({ kind: "error", text: parsed.error });
    const res = prepare ? prepare(parsed.raw as I) : { input: parsed.raw as I };
    if ("error" in res) return setMsg({ kind: "error", text: res.error });
    setMsg(res.note ? { kind: "note", text: res.note } : null);
    setDraft(fresh(res.input));
    onApply(res.input);
  }

  function reset() {
    setDraft(fresh(initialInput));
    setMsg(null);
    onApply(initialInput);
  }

  return (
    <form className="fp-input" onSubmit={apply}>
      <span className="fp-input__lead">Try your own input:</span>
      {fields.map((f) => (
        <label key={f.key}>
          <span>{f.label}</span>
          <input value={draft[f.key] ?? ""} inputMode={f.kind === "number" ? "numeric" : "text"}
            className={f.kind === "number" ? "" : "is-wide"}
            onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))} />
        </label>
      ))}
      <button type="submit">Run</button>
      <button type="button" className="fp-link" onClick={reset}>Reset example</button>
      {msg && <p className={`fp-formmsg fp-formmsg--${msg.kind}`} role="status">{msg.text}</p>}
    </form>
  );
}
