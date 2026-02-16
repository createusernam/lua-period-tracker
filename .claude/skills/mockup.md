# /mockup — Create Interactive Screen Prototype

Create a standalone HTML mockup for stakeholder discussion before implementation.

## Usage

`/mockup [screen description]`

## Steps

1. Read `src/styles/index.css` for current design tokens
2. Create `mockups/` directory if it doesn't exist
3. Create a standalone HTML file with:
   - Lua's design tokens (CSS custom properties from `:root`)
   - Lua's font stack and typography rules
   - Mobile-first layout (375px base, responsive)
   - Real copy in Russian where appropriate
   - All states: default, empty, error
4. Name the file descriptively: `mockups/[feature]-[screen].html`
5. Report the file path — user opens in browser to review
6. Iterate on feedback until approved
7. When approved, hand off to spec writers

Uses the `design-prototyper` agent personality.
