import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Unit tests only by default. Live integration tests (which hit rest.kegg.jp)
    // run separately via `npm run test:integration` so builds/publishes never
    // depend on the external KEGG API.
    exclude: ['**/node_modules/**', '**/dist/**', '**/integration.test.ts'],
  },
});
