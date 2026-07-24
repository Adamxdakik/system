// Tailwind v4 is handled by @tailwindcss/vite — no PostCSS plugins needed.
// This file exists to prevent Vite from crawling up to the workspace root and
// picking up the root postcss.config.js (which requires `autoprefixer`).
export default {
  plugins: {},
};
