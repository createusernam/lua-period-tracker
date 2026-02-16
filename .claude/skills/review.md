# /review — QA + Architecture Review

Run a full review of recent changes. Spawns QA and CTO review agents in parallel.

## Steps

1. Run `npx vitest run` to verify all tests pass
2. Run `npx tsc -b` to verify TypeScript builds clean
3. Spawn **QA reviewer** agent (qa-specialist personality) to review all modified files for:
   - Bugs, edge cases, race conditions
   - Missing error/empty/loading states
   - Test coverage gaps
   - Accessibility issues
4. Spawn **CTO reviewer** agent (cto personality) to review for:
   - Architecture cleanliness, separation of concerns
   - Performance (unnecessary re-renders, heavy computations)
   - Dead code, DRY violations
   - Bundle size concerns
5. Wait for both reviews
6. Present findings grouped by severity: Critical → Major → Minor
7. Ask user which issues to fix

Both agents write reports to `docs/QA-REVIEW.md` and `docs/CTO-REVIEW.md`.
