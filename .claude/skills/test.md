# /test — Run Tests + Build Check

Quick verification that everything works.

## Steps

1. Run `npx vitest run` — report pass/fail count
2. Run `npx tsc -b` — report any TypeScript errors
3. If both pass, report "All clear: N tests pass, build clean"
4. If tests fail, show failing test names and error messages
5. If build fails, show TypeScript errors with file:line references
6. Optionally run `npx vite build` for production build verification if user adds `--build` flag
