import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'debug',
          setupFiles: [],
          include: ['src/**/*.{debug}.{js,ts}'],
          exclude: ['node_modules/**', 'dist/**'],
        },
      },
      {
        // Test files are run twice: executed by the default pool for their runtime expectations, and type checked by `tsc` for their compile time
        // assertions. `include` and `typecheck.include` deliberately match the same files, which is why each test file is reported twice.
        test: {
          name: 'unit',
          setupFiles: [],
          include: ['src/**/*.{test,unit.test,spec,unit.spec}.{js,ts}'],
          exclude: ['node_modules/**', 'dist/**'],
          typecheck: {
            enabled: true,
            include: ['src/**/*.{test,unit.test,spec,unit.spec}.ts'],
            exclude: ['node_modules/**', 'dist/**'],
            tsconfig: './tsconfig.test.json',
            // Vitest 5.0.1 documents, but does not apply, a default for this, but consumes it unguarded when spawning the checker
            spawnTimeout: 10000,
          },
        },
      },
    ],
  },
});
