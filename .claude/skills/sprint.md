# /sprint — Full Feature Development Cycle

Run the complete team workflow for implementing features: brainstorm → implement → review → fix → verify.

## Usage

`/sprint [feature description]`

## Steps

1. **Brainstorm** — Spawn CTO + PM agents in parallel to analyze the feature:
   - CTO: architecture decisions, component structure, risk assessment
   - PM: prioritization, acceptance criteria, scope boundaries
   - Output: `docs/BRAINSTORM-CTO.md` and `docs/BRAINSTORM-PM.md`

2. **Implement** — Based on brainstorm output:
   - Create tasks with dependencies
   - Implement features sequentially (respecting dependency order)
   - All CSS in `src/styles/index.css`, follow Arutyunov design system
   - Write/update tests for new code

3. **Review** — Spawn QA + CTO review agents in parallel:
   - QA: bugs, edge cases, test gaps
   - CTO: architecture, performance, dead code
   - Output: `docs/QA-REVIEW.md` and `docs/CTO-REVIEW.md`

4. **Fix** — Address all Critical and Major findings from reviews

5. **Verify** — Run full test suite + TypeScript build + production build

6. **Report** — Summarize what was built, what was fixed, final test/build status
