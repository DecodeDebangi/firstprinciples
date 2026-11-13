import { useEffect, useState } from "react";
import { load, onChange, setStatus, type Status } from "../lib/progress";

const CHOICES: { value: Status | null; label: string }[] = [
  { value: "solved", label: "✓ Solved it" },
  { value: "shaky", label: "? Shaky" },
  { value: null, label: "Not yet" },
];

/**
 * "How did it go?" for one problem. Saved in this browser only; shows on the roadmap, the problem list and /practice/.
 * Renders a neutral state on the server, then picks up the stored choice after hydration.
 */
export default function ProgressToggle({ slug }: { slug: string }) {
  const [status, setLocal] = useState<Status | null | undefined>(undefined);
  useEffect(() => {
    const read = () => setLocal(load().problems[slug]?.status ?? null);
    read();
    return onChange(read);
  }, [slug]);

  return (
    <div className="ptoggle">
      <p className="ptoggle__q" id={`ptoggle-${slug}`}>How did it go?</p>
      <div className="ptoggle__opts" role="radiogroup" aria-labelledby={`ptoggle-${slug}`}>
        {CHOICES.map((c) => (
          <button key={c.label} type="button" role="radio" aria-checked={status === c.value}
            className={`ptoggle__opt${status === c.value ? " is-on" : ""}${c.value ? ` ptoggle__opt--${c.value}` : ""}`}
            disabled={status === undefined} onClick={() => { setStatus(slug, c.value); setLocal(c.value); }}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="ptoggle__note">
        Saved in this browser only, nothing is sent anywhere. It marks your roadmap and problem list, and shaky ones come
        back on the <a href="/practice/">Practice</a> page, where you can also back it up.
      </p>
    </div>
  );
}
