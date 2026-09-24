# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Keeping this file and README.md current

**`CLAUDE.md` and `README.md` are part of the deliverable of every task, not separate chores.** Whenever a change makes something here or in the README inaccurate, update it in the same change — never leave it for later, and never finish a task reporting only the code change.

Concrete triggers:

| A change that ...                                         | ... requires updating                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| adds, removes or renames an export                        | `README.md` `# Usage` section, and [Exports](#exports) below                      |
| changes an exported type's or function's semantics        | `README.md` `# Usage` section and any example that demonstrates it                |
| adds or changes an npm script, Vitest project or tsconfig | [Commands](#commands) / [Testing](#testing), and `# Development` in `README.md`   |
| adds a source directory under `src/`                      | [Layout](#layout) below                                                           |
| establishes a new convention, or hits a new gotcha        | [Code style](#code-style) / [Gotchas and known issues](#gotchas-and-known-issues) |
| resolves one of the known issues listed below             | remove it from [Gotchas and known issues](#gotchas-and-known-issues)              |

Any code sample added to `README.md` must be verified against `tsc` before being committed — see [Verifying README samples](#verifying-readme-samples).

## Project

`@ofzza/jsonschema-reflect-ts` — helps generate TS data models, provides TS utility types for deep type inference and provides TS runtime utilities for type reflection, all based off of a JSON schema. MIT, published to NPM, built from `src/` to `dist/`.

- **ESM only** (`"type": "module"`). `main` is `dist/index.js`, `types` is `dist/index.d.ts`.
- **No public API yet.** `src/index.ts` is a placeholder that exports nothing, and `src/index.test.ts` a placeholder test. The previous implementation lives in the gitignored `src/__legacy/` (see [Layout](#layout)) as reference material while the library is rebuilt.
- Toolchain last verified against: Node 24.15, npm 11.12, TypeScript 5.9.3, Vitest 5.0.1.

## Branching

- **`develop` is the work-in-progress trunk.** Create every feature, fix or dependency branch from `develop`, and open every pull request against `develop`.
- **`master` holds only the latest stable release.** It is never committed to directly and never receives feature pull requests — it is only updated by merging `develop` into it when a stable version is released.

## Layout

```
src/
  index.ts                 Barrel, currently a placeholder exporting nothing
  index.test.ts            Placeholder test
  __legacy/                Previous implementation (OntologyService, Infer* utility types, runtime reflection) and its tests.
                           GITIGNORED and excluded from both tsconfigs - local reference only, never committed or built
tsconfig.json              Build config. EXCLUDES *.test.ts / *.spec.ts and src/__legacy
tsconfig.test.json         Typecheck config. Includes everything but src/__legacy, emits nothing
vite.config.ts             Two Vitest projects: debug, unit
dist/                      Build output, gitignored
```

Convention for new modules: one directory per module under `src/`, each an `index.ts` + `index.test.ts` pair, re-exported from `src/index.ts` (`export * from './<module>/index.js';`).

## Commands

- `npm run build` — `tsc`, compiles `src/` to `dist/` with declarations.
- `npm run dev` — the same in watch mode.
- `npm test` — runs every `test:*` script.
  - `npm run test:unit` — `vitest run --project unit`, a single invocation that both executes tests and type checks them.
- `npm run ci` — runs every `ci:*` script: `ci:build`, `ci:eslint`, `ci:prettier`, `ci:test-unit`. This is what GitHub Actions runs.
- `npm run prepare` — builds; invoked automatically by a local `npm install`/`npm ci` and before `npm publish`, but **not** when the package is installed as a dependency.

**Script wiring matters when adding one.** `test` is `npm-run-all test:*` and `ci` is `npm-run-all ci:*`, so a new `test:<name>` joins `npm test` automatically — but it will _not_ run in CI until a matching `ci:test-<name>` script exists. Add both.

## Testing

Vitest, with `describe`/`it`/`expect` imported explicitly (`globals` is not enabled). Two projects in `vite.config.ts`:

- **`unit`** — matches `src/**/*.{test,unit.test,spec,unit.spec}.{js,ts}`. It runs each test file through **both** Vitest pools in one invocation: the default pool executes it for its runtime expectations, and `tsc` (via `typecheck.tsconfig: './tsconfig.test.json'`) type checks it for its compile-time assertions, reporting type errors as failed tests.

  `include` and `typecheck.include` deliberately match the same files. Vitest globs the two independently and does not warn when they overlap, so **every test file is collected and reported twice** — each test shows up once per pool. That is expected, not a misconfiguration. Two consequences worth knowing: a file change triggers two reruns in watch mode, and a file containing no runtime `test()`/`describe()` call fails the runtime pass with "No test suite found in file" unless `--passWithNoTests` is set (it is, in `test:unit`).

  Type errors in non-test sources are reported too — `tsc` runs over the whole `tsconfig.test.json` program with no file list, so an error outside a test file surfaces as an "Unhandled Source Error" and fails the run without being attributed to any test. `typecheck.ignoreSourceErrors` would suppress that; it is deliberately left at its default.

  `typecheck.spawnTimeout` is pinned to `10000` because Vitest 5.0.1 documents a `10_000` default for it but never applies one, yet consumes it unguarded when spawning the checker, which leaves an intermittent race.

- **`debug`** — `include: ['src/**/*.{debug}.{js,ts}']`, i.e. files ending in `.debug.ts` / `.debug.js`. Driven by the "TS: Debug Current Test File" launch config in `.vscode/launch.json`. Separately, `.gitignore` excludes `*.debug.test.ts` — those match the `unit` glob, so scratch debug tests run locally but are never committed.

`tsconfig.test.json` exists because `tsconfig.json` excludes `*.test.ts` from the build — without it nothing would ever type check the test files, and compile-time assertions in them would be silently inert.

### Type level assertions

This library is mostly utility types, which have no runtime behaviour to unit test — they are kept honest by compile-time assertions. This repo defines no assertion types of its own; use the ones from the sibling `@ofzza/std-ts` (`AssertTypeEquality`, `AssertTypeInequality`, `AssertTypeAssignable`, `AssertTypeUnassignable`), which resolve to `true` when they hold and `never` when they don't.

**Consume an assertion by assigning `true` to it — never through a generic constraint.** `never` is assignable to everything, so `never extends true` is `true` and a constraint like `<T extends true>` is satisfied by a _failing_ assertion exactly as happily as by a passing one. Assigning a value is the only sound discriminator, because nothing is assignable to `never`.

The idiom to use in tests gives a compile-time check from the `tsc` pass and a runtime expectation from the default pool from one line:

```ts
expect(true satisfies AssertTypeEquality<string, string>).toBe(true);

// @ts-expect-error `AssertTypeEquality<'a' | 'b', 'a'>` resolves to `never`
expect(true satisfies AssertTypeEquality<'a' | 'b', 'a'>).toBe(true);
```

An unused `@ts-expect-error` is itself an error, so regressions fail the build in both directions.

**Probe new edge cases against `tsc` before writing them down.** TypeScript's behaviour around `any`, `never`, unions, intersections, property modifiers and deeply recursive types is frequently not what it seems — write a scratch file that asserts the expected outcome, run `tsc --noEmit` on it, and let the errors tell you the truth. Reasoning it out and committing the result is how wrong tests get written.

### Verifying README samples

When `README.md` gains code samples, annotate them `// This will work` / `// This will fail at compile time`. Those claims are checkable: extract the ```ts blocks, point the import at `./src/index.js`, and run `tsc --noEmit` — every "will work" line must compile and every "will fail" line must error. Do this whenever a sample or an exported type changes.

## Code style

Enforced by `ci:prettier` and `ci:eslint`, both of which only look at `src` — **`README.md` and `CLAUDE.md` are not format-enforced**, so keep them tidy by hand.

- Prettier: `printWidth: 160`, single quotes, 2-space indent, semicolons, trailing commas, always-parenthesised arrow params.
- JSDoc on every exported symbol. One-line summary in imperative third person ("Gets ...", "Asserts ...", "Checks if ..."). Types get a prefix: `Utility type: ...`. Only `@param` and `@returns` are used — no `@example`, `@template` or `@see`.
- Internal, non-exported symbols are `_`-prefixed and still get JSDoc. ESLint's `no-unused-vars` ignores `_`-prefixed vars, args and catch bindings.
- Group sections with `// #region Name` / `// #endregion`.
- Generic parameters are `T`-prefixed and descriptive (`TSchema`, `TModelName`).
- `it()` names are capitalised verb phrases: `it('Infers all model names from the schema', ...)`.
- Rules deliberately off: `@typescript-eslint/no-explicit-any`, `ban-ts-comment`, `no-empty-object-type`. `any` and `@ts-expect-error` are fine to use where they earn their place.

## Gotchas and known issues

- **Relative imports in `src/` must carry an explicit `.js` extension.** `moduleResolution: bundler` lets TSC accept `./module`, and TSC does not rewrite specifiers on emit — so the extensionless form ships to `dist/` and Node's ESM resolver rejects it (`ERR_UNSUPPORTED_DIR_IMPORT`). Write `./module/index.js`.
- **`src/__legacy/` is still run by `npm test` locally.** It is gitignored and excluded from both tsconfigs (so it is neither built nor type checked, and ESLint skips it via the `.gitignore` import), but `vite.config.ts` does not exclude it — its `*.unit.test.ts` files match the `unit` glob and are executed by the runtime pool. CI never sees them because they are not committed, so local and CI test counts differ. Add `'src/__legacy/**'` to the `unit` project's `exclude`, or delete the directory once it has been ported.
- **Never use `npm ci --ignore-scripts` here.** `unrs-resolver` (`postinstall`) and `@parcel/watcher` (`install`) rely on their install hooks to link native bindings; skipping them risks breaking ESLint. The CI workflow uses plain `npm ci` for this reason.
- **`prepare` builds during install**, so `npm ci` compiles once and `ci:build` compiles again. The duplicate build costs about a second and is accepted.
- **The real Node floor is 22.13.0 / 24.0.0**, not the bare major versions — imposed by `vitest@5` (`^22.12.0 || ^24.0.0 || >=26.0.0`), `vite@8` (`^20.19.0 || >=22.12.0`) and `eslint-visitor-keys@5` (`^22.13.0 || >=24`). Node 20 is not supported. `actions/setup-node` with `node-version: 22` resolves to the latest 22.x and satisfies this; a pinned older patch would not. There is no `engines` field declaring this.
- **`package.json` has no `files` field**, so the published tarball also ships `src/`, tests, `tsconfig*.json`, `vite.config.ts` and `CLAUDE.md`. Harmless but untidy; fix when touching package metadata.
- **`package.json` has no `dependencies` yet.** Anything listed there is installed for every consumer. `@types/json-schema` is a devDependency — move it to `dependencies` only if a published `.d.ts` ends up referencing its types. `@types/node` is a devDependency needed only by `eslint.config.js`.
- **`ts-jest` is an unused devDependency.** Vitest is the test runner; `ts-jest` is a leftover and can be removed.
- **`@types/node` is pinned to the lowest supported Node major** (currently `^22`), so type checking cannot silently rely on APIs newer than the CI matrix floor. `.github/dependabot.yml` ignores its semver-major updates for this reason; bump it by hand together with the matrix.
- **`@eslint/js` must be a direct devDependency.** `eslint.config.js` imports it, and since ESLint 10 it is no longer pulled in transitively by `eslint`.
- **`tsconfig.json` excludes test files**, so `npm run build` will never report a type error in a test. Use `npm test` (the `unit` project type checks them) or `tsc --noEmit -p tsconfig.test.json`.
- **`tsc` never cleans `dist/`.** A local `dist/` can hold stale output from earlier builds (e.g. `dist/ndr5-ontology/`). It is gitignored, but with no `files` field it would be published — `rm -rf dist` before publishing.
- **The `.vscode/` re-includes in `.gitignore` are ineffective.** The bare `.vscode/` line ignores the whole directory, and git cannot re-include a file whose parent directory is excluded, so the later `!.vscode/settings.json`, `!.vscode/launch.json` etc. lines do nothing and `.vscode/launch.json` / `extensions.json` are untracked. Remove the `.vscode/` line (keeping `.vscode/*`) to actually commit them.
- The recommended VS Code extension set includes `orta.vscode-twoslash-queries`, which powers the `// ^?` type-inspection comments used in sibling repos.
- **Not yet adopted:** the sibling `ts-std` repo keeps a `src/readme.spec.ts` whose `describe`/`it` tree mirrors its README headings 1:1, turning documentation examples into executable tests. This repo has no equivalent — consider adding one once the README documents an API.

## Continuous integration

`.github/workflows/ci.yml` runs `npm ci && npm run ci` on every pull request targeting `master` and on every push to `master`, across a Node matrix of `[22, 24]` with `fail-fast: false`. In-progress runs are cancelled only for pull requests, never for `master`.

**The workflow triggers do not yet match the [branching model](#branching).** It only watches `master`, so pull requests targeting `develop` — which is all of them — and pushes to `develop` get no CI run at all. Likewise `.github/dependabot.yml` sets no `target-branch`, so Dependabot opens its pull requests against the default branch rather than `develop`. Both need `develop` added.

**A workflow alone does not block merges.** Making it mandatory requires branch protection on `master` in GitHub repo settings, marking `CI / Node 22` and `CI / Node 24` as required status checks. That is a repo setting, not a file in this repository.

`.github/` also holds `pull_request_template.md` (adapted from the author's template in the `kickstart` repo) and `dependabot.yml` (weekly npm and github-actions updates, with devDependencies grouped into one pull request, and `@types/node` majors ignored).

## Exports

The public surface, re-exported from `src/index.ts`. Keep this list in sync (see [Keeping this file and README.md current](#keeping-this-file-and-readmemd-current)).

None yet — `src/index.ts` is a placeholder. List each export here, grouped by source module, as it is added.
