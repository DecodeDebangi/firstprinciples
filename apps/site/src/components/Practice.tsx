import { useEffect, useMemo, useState } from "react";
import type { BankItem } from "../lib/bank";
import { fromBackup, load, merge, onChange, review, save, toCode, today, INTERVALS, type Progress } from "../lib/progress";

const SESSION = 10;
const KIND: Record<BankItem["kind"], string> = { concept: "Theory", pattern: "Which technique?", complexity: "Complexity" };

type Problem = { slug: string; title: string; topic: string };

/** Random order (a fresh shuffle each time it's called). */
function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Due cards first (most overdue first), then questions never seen, up to `n`. */
function pickSession(bank: BankItem[], p: Progress, n: number, anyway = false): BankItem[] {
  const now = today();
  const due = bank.filter((b) => p.cards[b.id] && p.cards[b.id].due <= now).sort((a, b) => p.cards[a.id].due.localeCompare(p.cards[b.id].due) || p.cards[a.id].box - p.cards[b.id].box);
  const fresh = shuffled(bank.filter((b) => !p.cards[b.id]));
  const out = [...due, ...fresh].slice(0, n);
  if (out.length || !anyway) return shuffled(out);
  // Nothing due and nothing new: practise the ones coming up soonest.
  return shuffled([...bank].sort((a, b) => p.cards[a.id].due.localeCompare(p.cards[b.id].due)).slice(0, n));
}

export default function Practice({ bank, problems, topics }: { bank: BankItem[]; problems: Problem[]; topics: string[] }) {
  const [p, setP] = useState<Progress>(() => load());
  const [topic, setTopic] = useState("");
  const [queue, setQueue] = useState<BankItem[] | null>(null);
  const [at, setAt] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ item: BankItem; right: boolean }[]>([]);
  useEffect(() => onChange(() => setP(load())), []);

  const pool = useMemo(() => (topic ? bank.filter((b) => b.topic === topic) : bank), [bank, topic]);
  const now = today();
  const dueCount = pool.filter((b) => p.cards[b.id] && p.cards[b.id].due <= now).length;
  const newCount = pool.filter((b) => !p.cards[b.id]).length;
  const solved = problems.filter((x) => p.problems[x.slug]?.status === "solved");
  const shaky = problems.filter((x) => p.problems[x.slug]?.status === "shaky");

  const start = (anyway = false) => {
    const q = pickSession(pool, load(), SESSION, anyway);
    setQueue(q); setAt(0); setPicked(null); setResults([]);
    setOrder(q.length ? shuffled(q[0].options.map((_, i) => i)) : []);
  };
  const item = queue?.[at];

  const choose = (i: number) => {
    if (!item || picked !== null) return;
    setPicked(i);
    const right = i === item.answer;
    const next = load();
    review(next, item.id, right);
    save(next);
    setP(next);
    setResults((r) => [...r, { item, right }]);
  };
  const advance = () => {
    if (!queue) return;
    const k = at + 1;
    setAt(k); setPicked(null);
    if (k < queue.length) setOrder(shuffled(queue[k].options.map((_, i) => i)));
  };

  // ---- In a session ----
  if (queue && item) {
    const right = picked !== null && picked === item.answer;
    return (
      <section className="pr-card" aria-live="polite">
        <div className="pr-card__top">
          <span className="pr-tag">{KIND[item.kind]} · {item.topic}</span>
          <span className="pr-progress">Question {at + 1} of {queue.length}</span>
        </div>
        {item.context && <blockquote className="pr-context">{item.context}</blockquote>}
        <p className="pr-q">{item.q}</p>
        <div className="pr-opts" role="group" aria-label="Answers">
          {order.map((i) => {
            const state = picked === null ? "" : i === item.answer ? " is-right" : i === picked ? " is-wrong" : " is-dim";
            return <button key={i} type="button" className={`pr-opt${state}`} disabled={picked !== null} onClick={() => choose(i)}>{item.options[i]}</button>;
          })}
        </div>
        {picked !== null && (
          <div className={`pr-why ${right ? "is-right" : "is-wrong"}`}>
            <p><strong>{right ? "✓ Right." : "✗ Not quite."}</strong> {item.why}</p>
            <p className="pr-why__more">
              {right ? `Next time in ${INTERVALS[p.cards[item.id]?.box ?? 1]} day${INTERVALS[p.cards[item.id]?.box ?? 1] === 1 ? "" : "s"}.` : "It'll come back next session."}{" "}
              <a href={item.href}>{item.hrefLabel} →</a>
            </p>
            <button type="button" className="pr-btn pr-btn--primary" onClick={advance} autoFocus>{at + 1 < queue.length ? "Next question" : "See results"}</button>
          </div>
        )}
      </section>
    );
  }

  // ---- Session finished ----
  if (queue && !item) {
    const score = results.filter((r) => r.right).length;
    const missed = results.filter((r) => !r.right);
    return (
      <section className="pr-card">
        <h2 className="pr-h">{queue.length ? `${score} of ${queue.length} right` : "Nothing to practise here yet"}</h2>
        {missed.length > 0 && (
          <>
            <p>These come back next session. Worth a look now:</p>
            <ul className="pr-list">{[...new Map(missed.map((m) => [m.item.href, m.item])).values()].map((m) => <li key={m.href}><a href={m.href}>{m.hrefLabel}</a></li>)}</ul>
          </>
        )}
        {queue.length > 0 && missed.length === 0 && <p>All right. Each one now waits a little longer before it comes back.</p>}
        <div className="pr-row">
          <button type="button" className="pr-btn pr-btn--primary" onClick={() => start()}>Another round</button>
          <button type="button" className="pr-btn" onClick={() => setQueue(null)}>Back to overview</button>
        </div>
      </section>
    );
  }

  // ---- Overview ----
  return (
    <>
      <section className="pr-card">
        <div className="pr-stats">
          <div><strong>{solved.length}</strong><span>of {problems.length} problems solved</span></div>
          <div><strong>{dueCount}</strong><span>question{dueCount === 1 ? "" : "s"} due{topic ? ` in ${topic}` : ""}</span></div>
          <div><strong>{newCount}</strong><span>not tried yet</span></div>
        </div>
        <label className="pr-topic">
          <span>Practise</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All topics ({bank.length} questions)</option>
            {topics.map((t) => <option key={t} value={t}>{t} ({bank.filter((b) => b.topic === t).length})</option>)}
          </select>
        </label>
        <div className="pr-row">
          {dueCount + newCount > 0
            ? <button type="button" className="pr-btn pr-btn--primary" onClick={() => start()}>Start {Math.min(SESSION, dueCount + newCount)} questions</button>
            : <>
                <p className="pr-note">Nothing due{topic ? ` in ${topic}` : ""} today. Come back tomorrow, or:</p>
                <button type="button" className="pr-btn" onClick={() => start(true)}>Practise anyway</button>
              </>}
        </div>
      </section>

      {shaky.length > 0 && (
        <section className="pr-card">
          <h2 className="pr-h">Marked shaky</h2>
          <p>You said these didn't go smoothly. Re-read the key question, then try LeetCode again.</p>
          <ul className="pr-list">{shaky.map((x) => <li key={x.slug}><a href={`/dsa/${x.slug}/`}>{x.title}</a> <span className="pr-muted">· {x.topic}</span></li>)}</ul>
        </section>
      )}

      <Backup p={p} setP={setP} />
    </>
  );
}

/** Download, copy, restore and clear: the only way progress leaves this browser is if you take it. */
function Backup({ p, setP }: { p: Progress; setP: (p: Progress) => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const marks = Object.keys(p.problems).length, cards = Object.keys(p.cards).length;

  const download = () => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `firstprinciples-progress-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(toCode(p)); setMsg({ ok: true, text: "Backup code copied. Paste it into this box on your other device." }); }
    catch { setCode(toCode(p)); setMsg({ ok: true, text: "Couldn't reach the clipboard, so the code is in the box below: copy it from there." }); }
  };
  const restore = (text: string) => {
    const got = fromBackup(text);
    if ("error" in got) return setMsg({ ok: false, text: got.error });
    const next = merge(load(), got);
    if (!save(next)) return setMsg({ ok: false, text: "This browser won't let the site store anything (private window or blocked storage)." });
    setP(next); setCode("");
    setMsg({ ok: true, text: `Restored ${Object.keys(got.problems).length} problem mark${Object.keys(got.problems).length === 1 ? "" : "s"} and ${Object.keys(got.cards).length} practice record${Object.keys(got.cards).length === 1 ? "" : "s"}, merged with what was here (newer wins).` });
  };
  const onFile = async (f: File | undefined) => { if (f) restore(await f.text()); };
  const clear = () => {
    if (!confirm("Clear every problem mark and practice record from this browser? This can't be undone unless you have a backup.")) return;
    const next: Progress = { v: 1, problems: {}, cards: {} };
    save(next); setP(next); setMsg({ ok: true, text: "Cleared." });
  };

  return (
    <section className="pr-card">
      <h2 className="pr-h">Your progress lives in this browser</h2>
      <p>There's no account: {marks || cards ? `${marks} problem mark${marks === 1 ? "" : "s"} and ${cards} practice record${cards === 1 ? "" : "s"} are saved here and nowhere else` : "nothing is saved yet"}.
        Clearing your browsing data erases it. To move it to another device or keep it safe, back it up.</p>
      <div className="pr-row">
        <button type="button" className="pr-btn" onClick={download} disabled={!marks && !cards}>Download backup file</button>
        <button type="button" className="pr-btn" onClick={copy} disabled={!marks && !cards}>Copy backup code</button>
        <label className="pr-btn pr-file">Restore from file<input type="file" accept="application/json,.json" onChange={(e) => onFile(e.target.files?.[0])} /></label>
      </div>
      <label className="pr-paste">
        <span>Or paste a backup code</span>
        <textarea rows={2} value={code} onChange={(e) => setCode(e.target.value)} placeholder="fp1.…" spellCheck={false} />
      </label>
      <div className="pr-row">
        <button type="button" className="pr-btn" onClick={() => restore(code)} disabled={!code.trim()}>Restore from code</button>
        <button type="button" className="pr-btn pr-btn--quiet" onClick={clear} disabled={!marks && !cards}>Clear my progress</button>
      </div>
      {msg && <p className={`pr-msg ${msg.ok ? "is-ok" : "is-bad"}`} role="status">{msg.text}</p>}
    </section>
  );
}
