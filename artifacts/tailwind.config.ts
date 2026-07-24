// Stub: prevents @replit/vite-plugin-cartographer (root = artifacts/) from crawling
// up to the workspace-root tailwind.config.ts, which requires packages not installed
// in any artifact (tailwindcss-animate, @tailwindcss/typography).
// Each artifact configures Tailwind v4 via its own src/index.css @theme directives.
export default {};
