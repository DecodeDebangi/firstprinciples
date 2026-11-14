declare namespace App {
  interface Locals {
    /** Set by a problem page so its MDX `h2` override can place the "try it first" box (see ProblemH2.astro). */
    tryFirst?: import("./components/TryFirst.astro").Props & { placed?: boolean };
  }
}
