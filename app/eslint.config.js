// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    // apps/web/public: static assets served as-is (theme-init.js is a plain, unbundled
    // pre-paint script — not part of the TS module graph).
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.gen.ts', '**/public/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);
