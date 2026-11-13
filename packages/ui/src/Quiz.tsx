import { useState } from "react";
import "./quiz.css";

export interface QuizQuestion {
  q: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Shown after answering, right or wrong. */
  why: string;
}

/**
 * "Check yourself": multiple-choice questions answered one at a time, with an explanation after each
 * and a score at the end. Nothing is stored; reloading starts over.
 */
export function Quiz({ title = "Check yourself", questions }: { title?: string; questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const right = picked.filter((p, k) => p === questions[k].answer).length;
  const done = answered === questions.length;

  return (
    <section className="fp-quiz" aria-label={title}>
      <header className="fp-quiz__head">
        <h3>{title}</h3>
        <span className="fp-quiz__score" aria-live="polite">{answered ? `${right} / ${answered} right` : `${questions.length} questions`}</span>
      </header>
      <ol className="fp-quiz__list">
        {questions.map((item, k) => {
          const choice = picked[k];
          return (
            <li key={k} className="fp-quiz__item">
              <p className="fp-quiz__q">{item.q}</p>
              <div className="fp-quiz__opts" role="group" aria-label={`Question ${k + 1}`}>
                {item.options.map((o, i) => {
                  const state = choice === null ? "" : i === item.answer ? " is-right" : i === choice ? " is-wrong" : " is-dim";
                  return (
                    <button type="button" key={i} className={`fp-quiz__opt${state}`} disabled={choice !== null}
                      aria-pressed={choice === i}
                      onClick={() => setPicked((p) => p.map((v, j) => (j === k ? i : v)))}>
                      {o}
                    </button>
                  );
                })}
              </div>
              {choice !== null && (
                <p className={`fp-quiz__why ${choice === item.answer ? "is-right" : "is-wrong"}`}>
                  <strong>{choice === item.answer ? "✓ Right. " : "✗ Not quite. "}</strong>{item.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {done && (
        <p className="fp-quiz__done">
          {right === questions.length ? "All correct." : `${right} of ${questions.length} correct.`}{" "}
          <button type="button" onClick={() => setPicked(questions.map(() => null))}>Try again</button>
        </p>
      )}
    </section>
  );
}
