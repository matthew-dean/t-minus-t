import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, 'test/setup.ts')],
    outputFile: {
      json: './test-results.json'
    },
    reporters: ['verbose'],
    // Force color output
    color: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '**/*.config.*'
      ]
    }
  }
});

