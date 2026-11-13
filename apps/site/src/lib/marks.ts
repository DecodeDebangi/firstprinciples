/**
 * Shows the reader's own progress on any page, from this browser's storage:
 * - an element with data-pslug="two-sum" gets a "solved" or "shaky" mark after it;
 * - an element with data-pcount="slug slug…" shows "n/m solved" once the reader has marked anything at all.
 * Pages render without it; with storage blocked, nothing appears.
 */
import { load, onChange } from "./progress";

const LABEL = { solved: "solved", shaky: "shaky" } as const;
const ICON = { solved: "✓", shaky: "?" } as const;

function apply() {
  const p = load();
  const any = Object.keys(p.problems).length > 0;
  document.querySelectorAll<HTMLElement>("[data-pslug]").forEach((el) => {
    const st = p.problems[el.dataset.pslug!]?.status;
    el.querySelector(":scope > .pmark")?.remove();
    if (!st) { delete el.dataset.status; return; }
    el.dataset.status = st;
    const mark = document.createElement("span");
    mark.className = `pmark pmark--${st}`;
    mark.title = st === "solved" ? "You marked this solved" : "You marked this shaky";
    mark.innerHTML = `<span aria-hidden="true">${ICON[st]}</span><span class="sr">(${LABEL[st]})</span>`;
    el.append(mark);
  });
  document.querySelectorAll<HTMLElement>("[data-pcount]").forEach((el) => {
    const slugs = el.dataset.pcount!.split(" ").filter(Boolean);
    const done = slugs.filter((s) => p.problems[s]?.status === "solved").length;
    el.textContent = `${done}/${slugs.length} solved`;
    el.hidden = !any || !slugs.length;
    el.classList.toggle("is-complete", done === slugs.length && slugs.length > 0);
  });
}

apply();
onChange(apply);
