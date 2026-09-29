import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Absolute roots: each package's own `test` script invokes this config with
// `--config ../../vitest.config.ts` from inside the package directory, so a
// relative `root` here would resolve against that cwd, not this file's
// directory, and double up (e.g. packages/shared/packages/shared).
const root = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

// test.projects: shared + api run under node, web runs under jsdom (ARCHITECTURE.md §1, §8).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'shared',
          root: root('./packages/shared'),
          environment: 'node',
        },
      },
      {
        test: {
          name: 'api',
          root: root('./apps/api'),
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: {
            '@': root('./apps/web/src'),
          },
        },
        test: {
          name: 'web',
          root: root('./apps/web'),
          environment: 'jsdom',
        },
      },
    ],
  },
});
