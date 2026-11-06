# firstprinciples

A friendly place to learn data structures and algorithms. Each problem page goes from brute force to the
optimal solution. You can step through every approach on your own input, and every time and space complexity
comes with its derivation.

The animations aren't hand-drawn. Each approach runs the real algorithm and records a snapshot at every
decision, and a reusable player replays those snapshots.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # type-check + static build into apps/site/dist/
```

## Layout

- `apps/site/`: the Astro static site. Problems live in `src/content/dsa/<number>-<slug>/`.
- `packages/ui/`: shared design tokens, the step tracer, the animation player and the growth chart.

Problem statements are written in our own words, and each page links to the original problem.
