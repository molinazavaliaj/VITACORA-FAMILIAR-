// Vitest corre solo los tests de test/. Los scripts/**/*.test.mjs son de node:test (node --test).
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'scripts/**/*.test.mjs'],
  },
});
