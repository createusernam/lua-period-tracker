# /deploy — Build and Deploy to GitHub Pages

Build the production bundle and deploy to GitHub Pages.

## Steps

1. Run `npx vitest run` — abort if any tests fail
2. Run `npm run build` — production build (tsc -b && vite build)
3. Show build output (bundle sizes, gzip sizes)
4. Ask user to confirm deployment
5. Run `npx gh-pages -d dist` to deploy to GitHub Pages
6. Report the live URL: `https://createusernam.github.io/lua-period-tracker/`
7. Remind: install on iPhone via Safari → Share → "Add to Home Screen"
