# AGENTS.md

Guidance for coding agents when working in this repository.

## Keeping this file and README.md current

**`AGENTS.md` and `README.md` are part of the deliverable of every task, not separate chores.** Whenever a change makes something here or in the README inaccurate, update it in the same change — never leave it for later, and never finish a task reporting only the code change.

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

TSschema — helps generate TS data models, provides TS utility types for deep type inference and provides TS runtime utilities for type reflection, all based off of a JSON schema. MIT, published to NPM as [**`@ofzza/tsschema`**](https://www.npmjs.com/package/@ofzza/tsschema) (npm names must be lowercase; "TSschema" is only the display name), built from `src/` to `dist/`.

- **ESM only** (`"type": "module"`). The entry points are the `exports` map (`.` → `types: ./dist/index.d.ts`, `default: ./dist/index.js`; `./codegen` → `./dist/codegen/index.{d.ts,js}`; plus `./package.json`); `main` and `types` mirror `.` for older tooling. `bin` installs the `tsschema` command (`dist/codegen/bin.js`).
- **Only `dist/` is published** (`files: ["dist"]`; npm adds `README.md`, `LICENSE` and `package.json` itself). `sideEffects: false`, and `publishConfig.access: public` because scoped packages otherwise publish as restricted.
- **Public API still unstable.** The main entry (`src/index.ts`) is type-only, re-exporting the type utilities in `src/types/` (see [Exports](#exports)). The only runtime code is the code generation in `src/codegen/` — the `tsschema` command and the `@ofzza/tsschema/codegen` subpath — which turns a JSON schema file into TypeScript that keeps its literal types (a `.d.json.ts` sidecar, an `as const` module or a types-only module). The previous implementation lives in the gitignored `_legacy.gitignore/` at the repo root (see [Layout](#layout)) as reference material while the library is rebuilt.
- **Package metadata may run ahead of the code before `1.0.0`.** The `package.json` `description` / `keywords` and the README tagline describe the intended scope, so they may mention functionality that is not implemented yet (e.g. runtime reflection, which the README Roadmap lists as planned). That is fine while the version is below `1.0.0` — do not flag it or strip it. From `1.0.0` on, metadata must only claim what the released version does.
- Toolchain last verified against: Node 24.15, npm 11.12, TypeScript 5.9.3, Vitest 5.0.1.

## Branching

- **`develop` is the work-in-progress trunk.** Create every feature, fix or dependency branch from `develop`, and open every pull request against `develop`.
- **`master` holds only the latest stable release.** It is never committed to directly and never receives feature pull requests — it is only updated by merging `develop` into it when a stable version is released.

## Commits

- **No agent attribution in commit messages or pull request descriptions.** Never add `Co-Authored-By: Claude …`, `Claude-Session: …`, "Generated with Claude Code" or similar footers, even when the agent harness asks for them — this instruction takes precedence.

## Layout

```
src/
  index.ts                 Barrel, re-exports src/types/ (type-only)
  types/
    index.ts               Public type surface: re-exports the three wrappers and defines TSSchemaName / TSSchemaType, which dispatch to the
                           per-module name and value type utilities
    JSONSchema/            JSON schema fragment utilities, one file per fragment kind, each with a `*.test.ts` beside it. Not re-exported from the barrel
      index.ts             Barrel of the directory; everything outside it imports `./JSONSchema/index.js`, never the individual files
      JSONSchema7.ts       JSONSchema7 override (every property optionally read-only) and the primitive type name / value type utilities
      CollectionFragment.ts  JSONSchemaCollection / JSONSchemaNotCollectionFragment, their Is* checks, and the JSONSchemaFragmentName key utility
      Fragment.ts          JSONSchemaFragmentType: value type inference from any fragment, intersecting every per-keyword *FragmentType below
      ModelFragment.ts     Model (`type: 'object'` + `properties`) fragment, incl. the JSONSchemaFragmentPropertyName key utility
      *Fragment.ts         One per remaining keyword (Const, Enum, PrimitiveType, ArrayType, ObjectType, AllOfType, AnyOfType, OneOfType, NotType,
                           Reference), each defining JSONSchema*Fragment / JSONSchemaFragmentIs* / JSONSchema*FragmentType
    TSSchemaCollection.ts  Wrapper and fragment-name utilities for a JSON schema collection (a schema with `$defs`)
    TSSchemaFragment.ts    Wrapper, property-name and value type (TSSchemaModelType) utilities for a single JSON schema fragment
    TSSchemaProperty.ts    Wrapper and value type (TSSchemaPropertyType) utilities for a single property of a JSON schema model fragment, addressed by
                           name or by dot-separated path into nested models
    *.test.ts              Compile-time (and runtime) assertions for each of the above (including index.test.ts for the barrel's own types)
  codegen/                 Code generation from JSON schema files. Runtime code, Node only. NOT re-exported from src/index.ts - published as the
                           `./codegen` subpath and the `tsschema` bin instead, so the main entry stays type-only
    index.ts               generateFiles (pure: JSON in, files out) and generate (reads, writes / checks files), and their option / result types
    cli.ts                 run(args, output, cwd): argument parsing, globbing, --check and --watch. Returns an exit code instead of exiting, for tests
    bin.ts                 Shebang entry point of the `tsschema` command, calling run()
    *.test.ts              Runtime tests (in temporary directories) plus compile-time equality of the generated res/ fixtures across all modes
_legacy.gitignore/         Previous implementation (OntologyService, Infer* utility types, runtime reflection) and its tests. GITIGNORED (by the
                           `*.gitignore/` rule) - local reference only, never committed. Outside every `src/`-scoped glob, so no config excludes it;
                           never move it back under src/, its tests import a missing `../models/ndr_ontology.js` and would fail if collected
res/                       JSON schema test fixtures. `*.json` is the source of truth; everything else is GENERATED by `npm run fixtures`, never edited:
                           `*.d.json.ts` sidecars + `*.models.ts` (tests import `res/*.json` through these), and `module/` / `types/` mode outputs
                           (used only by src/codegen tests). `edge.json` covers code generation edge cases (non-identifier / reserved / colliding names)
tsconfig.json              Type check (and editor) config. Includes all of src/ (tests too) and res/**/*.ts; emits nothing.
                           `rootDir: ./` so tests may import `res/`; `allowArbitraryExtensions` + `resolveJsonModule` so `res/*.json` imports are
                           typed by their sidecars
tsconfig.build.json        Build config, extending tsconfig.json. `rootDir: ./src`, so `src/index.ts` emits to `dist/index.js`, with declarations.
                           EXCLUDES *.test.ts / *.spec.ts (and res/)
vite.config.ts             Two Vitest projects: debug, unit
dist/                      Build output, gitignored
```

Convention for new modules: one directory per module under `src/`, each an `index.ts` + `index.test.ts` pair, re-exported from `src/index.ts` (`export * from './<module>/index.js';`). The exception is runtime code that should not load with the type-only main entry, like `src/codegen/`: give it its own `exports` subpath instead.

## Commands

- `npm run build` — `tsc -p tsconfig.build.json`, compiles `src/` to `dist/` with declarations. `prebuild` runs `clean` first, so renamed or removed modules never leave stale output behind to be published.
- `npm run dev` — the same in watch mode.
- `npm run fixtures` — builds, then runs the built `tsschema` three times over `res/*.json`: sidecar + models next to each JSON (`--import-from ../src/index.js`), and `module` / `types` mode into `res/module/` / `res/types/` (`--import-from ../../src/index.js`). Run it after changing a fixture or `src/codegen/`; `src/codegen/index.test.ts` fails while any committed fixture differs from what the generator would produce now. Not a `test:`/`ci:` script — CI catches stale fixtures through that test.
- `npm test` — runs every `test:*` script.
  - `npm run test:unit` — `vitest run --project unit`, a single invocation that both executes tests and type checks them.
- `npm run ci` — runs every `ci:*` script: `ci:build`, `ci:eslint`, `ci:prettier`, `ci:test-unit`. This is what GitHub Actions runs.
- `npm run prepare` — builds; invoked automatically by a local `npm install`/`npm ci` and before `npm publish`, but **not** when the package is installed as a dependency.
- `prepublishOnly` — runs `npm run ci` before `npm publish`, so a failing build is never published.

Releasing a version (pre-publish checklist, then the version bump, merge to `master` and `npm publish` steps) is documented in `PUBLISH.md`. Keep it in sync when a change affects packaging, the release flow or what the checklist checks.

**Script wiring matters when adding one.** `test` is `npm-run-all test:*` and `ci` is `npm-run-all ci:*`, so a new `test:<name>` joins `npm test` automatically — but it will _not_ run in CI until a matching `ci:test-<name>` script exists. Add both.

## Testing

Vitest, with `describe`/`it`/`expect` imported explicitly (`globals` is not enabled). Two projects in `vite.config.ts`:

- **`unit`** — matches `src/**/*.{test,unit.test,spec,unit.spec}.{js,ts}`. It runs each test file through **both** Vitest pools in one invocation: the default pool executes it for its runtime expectations, and `tsc` (via `typecheck.tsconfig: './tsconfig.json'`) type checks it for its compile-time assertions, reporting type errors as failed tests.

  `include` and `typecheck.include` deliberately match the same files. Vitest globs the two independently and does not warn when they overlap, so **every test file is collected and reported twice** — each test shows up once per pool. That is expected, not a misconfiguration. Two consequences worth knowing: a file change triggers two reruns in watch mode, and a file containing no runtime `test()`/`describe()` call fails the runtime pass with "No test suite found in file" unless `--passWithNoTests` is set (it is, in `test:unit`).

  Type errors in non-test sources are reported too — `tsc` runs over the whole `tsconfig.json` program with no file list, so an error outside a test file surfaces as an "Unhandled Source Error" and fails the run without being attributed to any test. `typecheck.ignoreSourceErrors` would suppress that; it is deliberately left at its default.

  `typecheck.spawnTimeout` is pinned to `10000` because Vitest 5.0.1 documents a `10_000` default for it but never applies one, yet consumes it unguarded when spawning the checker, which leaves an intermittent race.

- **`debug`** — `include: ['src/**/*.{debug}.{js,ts}']`, i.e. files ending in `.debug.ts` / `.debug.js`. Driven by the "TS: Debug Current Test File" launch config in `.vscode/launch.json`. Separately, `.gitignore` excludes `*.debug.test.ts` — those match the `unit` glob, so scratch debug tests run locally but are never committed.

The `src/codegen/` tests are the only ones with real runtime behaviour: they write to `os.tmpdir()` directories, and read `res/` relative to the working directory (Vitest runs from the repo root). The `--watch` test waits on a real `fs.watch` event via `expect.poll`.

`tsconfig.json` deliberately includes the test files, and the build uses a separate `tsconfig.build.json` that excludes them — see the tsserver gotcha below for why the inclusive config has to be the one named `tsconfig.json`.

### Type level assertions

This library is mostly utility types, which have no runtime behaviour to unit test — they are kept honest by compile-time assertions. This repo defines no assertion types of its own; use the ones from the sibling `@ofzza/tsstd` (`AssertTypeEquality`, `AssertTypeInequality`, `AssertTypeAssignable`, `AssertTypeUnassignable`), which resolve to `true` when they hold and `never` when they don't.

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

Enforced by `ci:prettier` and `ci:eslint`, both of which only look at `src` — **`README.md` and `AGENTS.md` are not format-enforced**, so keep them tidy by hand.

- Prettier: `printWidth: 160`, single quotes, 2-space indent, semicolons, trailing commas, always-parenthesised arrow params.
- JSDoc on every exported symbol, following `src/types/JSONSchema/`: a descriptive file header comment, and a summary in third person ("Gets ...", "Infers ...", "Wraps ...", "Represents ...") with no `Utility type:` prefix, followed by any fallback behaviour (what an unspecified / unsupported input infers). Only `@param` and `@returns` are used — no `@example`, `@template` or `@see`.
- In conditional type chains, put a `// comment` line before each branch saying what it handles (Prettier places it after the `?` / `:`), rather than trailing comments.
- Internal, non-exported symbols are `_`-prefixed and still get JSDoc. ESLint's `no-unused-vars` ignores `_`-prefixed vars, args and catch bindings.
- Group sections with `// #region Name` / `// #endregion`.
- Generic parameters are `T`-prefixed and descriptive (`TSchema`, `TModelName`).
- `it()` names are capitalised verb phrases: `it('Infers all model names from the schema', ...)`. Each test file has one top-level `describe` named after its module, with a nested `describe` per exported type. The exception is `src/types/JSONSchema/`: every test file there keeps the `JSONSchema > JSONSchema fragments > <Kind> fragment` tree (`JSONSchema7.test.ts`: `JSONSchema > Primitive types`) that the module had as a single file, so test names are unchanged by the split.
- Rules deliberately off: `@typescript-eslint/no-explicit-any`, `ban-ts-comment`, `no-empty-object-type`. `any` and `@ts-expect-error` are fine to use where they earn their place.

## Gotchas and known issues

- **Relative imports in `src/` must carry an explicit `.js` extension.** `moduleResolution: bundler` lets TSC accept `./module`, and TSC does not rewrite specifiers on emit — so the extensionless form ships to `dist/` and Node's ESM resolver rejects it (`ERR_UNSUPPORTED_DIR_IMPORT`). Write `./module/index.js`.
- **Editors only pick up a config named `tsconfig.json` — so it must include every file you open, tests included.** `tsserver` (VS Code's TypeScript service) finds the nearest `tsconfig.json` and never looks at differently named configs. A file excluded from it falls into an "inferred project" with default compiler options, which shows spurious errors (e.g. "'--allowArbitraryExtensions' is not set" on `res/*.json` imports, and failing `AssertType*` assertions). This is why `tsconfig.json` is the inclusive type check config and the build lives in `tsconfig.build.json`. Check which project a file lands in by asking `tsserver` for `projectInfo` (an inferred project reports `/dev/null/inferredProject*`).
- **ESLint's typed-parser block uses `project: './tsconfig.json'`** explicitly, rather than `projectService: true`. Before the tsconfig split, the project service failed on test files with "was not found by the project service", because `tsconfig.json` excluded them; that no longer applies, so switching is possible but untested.
- **Never use `npm ci --ignore-scripts` here.** `unrs-resolver` (`postinstall`) and `@parcel/watcher` (`install`) rely on their install hooks to link native bindings; skipping them risks breaking ESLint. The CI workflow uses plain `npm ci` for this reason.
- **`prepare` builds during install**, so `npm ci` compiles once and `ci:build` compiles again. The duplicate build costs about a second and is accepted.
- **The real Node floor is 22.13.0 / 24.0.0**, not the bare major versions — imposed by `vitest@5` (`^22.12.0 || ^24.0.0 || >=26.0.0`), `vite@8` (`^20.19.0 || >=22.12.0`) and `eslint-visitor-keys@5` (`^22.13.0 || >=24`). Node 20 is not supported. `actions/setup-node` with `node-version: 22` resolves to the latest 22.x and satisfies this; a pinned older patch would not. There is no `engines` field declaring this.
- **npm package names must be lowercase.** `@ofzza/TSschema` is rejected for new packages ("name can no longer contain capital letters"); the package is `@ofzza/tsschema`. GitHub URLs are case-insensitive, so `repository`/`homepage` keep `TSschema`. The same applies to the `@ofzza/tsstd` devDependency, whose `package.json` name and import specifier must both be lowercase.
- **`files: ["dist"]` is an allowlist.** Anything else that must ship has to be added there. Check with `npm pack --dry-run`.
- **The `exports` map seals deep imports.** Only `.` and `./package.json` resolve, so `@ofzza/tsschema/dist/types/JSONSchema/index.js` fails under `node16`/`nodenext`/`bundler`. If `JSONSchema/` utilities should become importable by consumers, re-export them from the barrel (or add an `exports` subpath) rather than relying on deep imports.
- **Do not add a `paths` alias to either tsconfig.** TSC does not rewrite aliased specifiers on emit, so they would ship to `dist/` unresolvable.
- **Do not add an `engines` field for the dev-toolchain Node floor.** It would restrict consumers of a types-only package for no reason.
- **Anything in `dependencies` is installed for every consumer — keep it to what published `.d.ts` / `.js` files import.** `@types/json-schema` is the only one, because `dist/types/JSONSchema/JSONSchema7.d.ts` imports `json-schema` (keep that import confined to `JSONSchema7.ts`). `@ofzza/tsstd` is a devDependency used by tests only — never import it from a non-test source, or the published `.d.ts` will reference a package consumers don't have. `@types/node` is a devDependency needed by `eslint.config.js` and to compile `src/codegen/` — keep Node types out of the *exported* codegen signatures, so the published `.d.ts` never needs `@types/node` (currently they import nothing). After changing exports, emit declarations to a scratch `--outDir` and grep their imports to check.
- **`tsconfig.json` sets `types: ["node"]` explicitly.** TypeScript 6 (which VS Code bundles, and uses unless told to use the workspace version) defaults `types` to `[]` instead of every `@types/*` package, so without it the editor reports TS2591 ("Try `npm i --save-dev @types/node` …") in `src/codegen/` while the workspace's TypeScript 5.9 passes. Any other ambient `@types` package needed globally must be added to that list too. It does not relax the rule above: exported codegen signatures must still not reference Node types.
- **`@types/node` is pinned to the lowest supported Node major** (currently `^22`), so type checking cannot silently rely on APIs newer than the CI matrix floor. `.github/dependabot.yml` ignores its semver-major updates for this reason; bump it by hand together with the matrix.
- **`@eslint/js` must be a direct devDependency.** `eslint.config.js` imports it, and since ESLint 10 it is no longer pulled in transitively by `eslint`.
- **`tsconfig.build.json` excludes test files**, so `npm run build` will never report a type error in a test. Use `npm test` (the `unit` project type checks them) or plain `tsc` (which reads the non-emitting `tsconfig.json`). Conversely, plain `tsc` builds nothing — always build with `-p tsconfig.build.json`.
- **`tsc` never cleans `dist/` by itself** — `npm run build` does, through `prebuild`/`clean`. `ci:build` and `npm run dev` call `tsc` directly and do not, so stale output can linger after them; it is only published through `npm publish`, whose `prepare` runs the cleaning `build`.
- **`@ofzza/tsstd` is only published as a prerelease (`^0.1.0-alpha.1`).** A caret range on a prerelease matches later `0.1.0-*` prereleases and stable `0.1.x`, but never prereleases of any other version (e.g. `0.2.0-alpha.1`) — bump the range by hand to move to those.
- **Never forward a type parameter whose constraint is a conditional type into another generic.** While `T` is generic, a constraint like `TName extends (T extends X ? A<T> : never)` is left unresolved. TS can't prove anything fits it: narrowing `T` in the body never re-checks another parameter's constraint, nested conditionals are split into branches that must all fit, and constraints written about different parameters (`T` vs an `infer U`) never relate. Public types may keep conditional constraints for call-site errors, but internal `_`-prefixed helpers take already-unwrapped types and either plain `keyof X` constraints (`JSONSchemaFragmentName`, `JSONSchemaFragmentPropertyName`) or unconstrained names they narrow themselves. At each hand-off, `infer` the concrete type and narrow with `TName extends keyof X ? … : fallback`; the narrowed `keyof X & TName` then trivially fits.
- **`rootDir` differs between the two tsconfigs on purpose.** `tsconfig.build.json` uses `./src` so the build output matches `main`/`types` (`dist/index.*`); `tsconfig.json` uses `./` because tests import fixtures from `res/`, which would otherwise fail with TS6059. A non-test source importing from `res/` will break the build.
- **`src/types/JSONSchema/` files import each other in a cycle, on purpose.** `Fragment.ts` imports every per-keyword file to dispatch on, and the recursive ones (`ModelFragment.ts`, `ArrayTypeFragment.ts`, `AllOfTypeFragment.ts`, `AnyOfTypeFragment.ts`, `ReferenceFragment.ts`) import `JSONSchemaFragmentType` back from it. That is fine because every import there is `import type` of recursive type aliases; keep it that way — a value import would make it a real runtime cycle.
- **Test helpers in `src/types/JSONSchema/` are duplicated per test file.** Fixture aliases (`JSONSchemaSchoolCollection`, `AssessmentModel`, …) and helpers (`_SchoolModel`, `_ModelA`, …) are copied into each test that uses them, because there is nowhere to share them: a non-test `.ts` under `src/` is built and can't import `res/` (see above), and a shared `*.test.ts` with no suite fails Vitest's runtime pass.
- **A conditional type on a bare type parameter distributes over unions — per conditional.** `JSONSchemaFragmentType` intersects one conditional per keyword, so a union input made each one distribute separately, and any branch matching only some union members produced `X | unknown`, i.e. `unknown`, collapsing the whole result. Distribute once at the entry point (`T extends unknown ? _Impl<T> : never`) and keep the per-keyword logic in the non-distributed helper.
- **Define every `JSONSchemaFragmentIs*<T>` as `T extends JSONSchema*Fragment ? true : false`.** Hand-written shape checks drifted from the fragment types that `JSONSchemaFragmentType` dispatches on (e.g. tuple `items` were "not an array" to the check but an array to the dispatcher).
- **Recurse over tuples with `T extends readonly [infer H, ...infer R]`, and handle the non-tuple case explicitly.** A plain `X[]` matches neither the empty-tuple nor the head/rest pattern; the TSstd `ArrayIsEmpty`/`ArrayHead` helpers return `boolean` / `X | undefined` for it, which previously fell through to `never` and wiped out the whole inferred type.
- **A homomorphic mapped type over a schema object copies the schema literal's modifiers into the inferred value type.** `{ [K in keyof P]: ... }`, with `P` a type parameter or `infer`red type, keeps each key's `readonly` and `?`. So an `as const` schema made every inferred model property `readonly`. `JSONSchemaModelFragmentType` maps with `-readonly` / `-?`. An optional key also adds `| undefined` to `P[K]` (which `-?` does not remove inside the body), so `Exclude` it before testing the fragment. Readonly-ness of the data should come from the schema's `readOnly` keyword (not yet supported), never from how the schema was declared. `const` / `enum` values are still returned as declared, so an object or array `const` in an `as const` schema infers a `readonly` value.
- **JSON schema type inference uses `unknown` for "no constraint".** Every per-keyword `JSONSchema*FragmentType` returns `unknown` when its keyword is absent or unsupported, so it is neutral in `JSONSchemaFragmentType`'s intersection. `never` is reserved for unsatisfiable schemas (conflicting siblings, empty `anyOf`).
- **Wrappers nest structurally: `JSONSchemaModelPropertyWrapper` ⊂ `JSONSchemaFragmentWrapper` ⊂ `JSONSchemaCollectionWrapper`.** A property wrapper is the fragment wrapper of its parent model plus `__property` / `__propertyName`, and every wrapper carries `__collection`. Any conditional that dispatches on several must test the most specific first — e.g. `TSSchemaType` tests the property wrapper before the fragment wrapper, and `TSSchemaName` tests the fragment wrapper before the collection wrapper (getting either backwards silently picks the wrong branch, which the `index.test.ts` regressions cover). Some of this is deliberate and tested: a fragment or property wrapper can be passed wherever a collection is accepted (addressing another fragment of the parent collection), a property wrapper wherever a fragment wrapper is (addressing a sibling property), and `TSSchemaModelType` of a property wrapper infers its parent model's type.
- **A name parameter defaulting to `never` must be guarded before a distributive check.** `TName extends keyof X ? ... : ...` with `TName = never` distributes over nothing and silently yields `never`. The wrappers test `[TName] extends [never]` first and substitute "all names", so an omitted name wraps every fragment / property (a union of wrappers), as a union of names does. `TSSchemaProperty<TModel>` with no name is the exception: it wraps the model itself as a property (e.g. an inline nested model).
- **`TSSchemaProperty` checks only a path's first segment at the call site.** Its name constraint is ``K | `${K}.${string}` ``; the rest of a dot-separated path is resolved in the body, and an invalid one infers `never` rather than erroring. A constraint listing every valid path is impossible: recursive schemas (`Person.mentor` → `Person`) make the set infinite, and a parameter cannot be constrained by a type computed from itself (TS2313). For the same reason `TSSchemaName` does not infer paths.
- **An exact property name wins over a dotted path.** `_TSSchemaProperty` tests `TName` against the model's property names first and only then splits it at its first `.`, so a property literally named `"a.b"` stays addressable. Each path step unions every keyword that can be "pathed into" (`$ref`, `anyOf` / `oneOf` / `allOf` members, model, array `items`) rather than picking one, so a fragment carrying several keywords needs no branch ordering.
- **A path into content of unknown shape wraps the empty schema `{}`, inferring `unknown`** — never `never`. That covers an object with no `properties`, a `$ref` which can not be resolved (incl. any `$ref` when no collection is known, detected as `JSONSchemaCollection extends TCollection`), and an array with no single schema `items`. Its `__propertyName` is the remainder of the path. Models with `properties` are treated as closed: an undefined name in one is `never`, even though JSON Schema allows additional properties by default.
- **`*Type` utilities prefer an explicitly passed collection over the wrapper's own.** "Passed" is detected as `JSONSchemaCollection extends TSchemaCollection` being false, so explicitly passing the bare `JSONSchemaCollection` counts as not passing one.
- **A JSON sidecar (`<name>.d.json.ts`) must declare each top-level key as a named export, never `export default`.** Under `module: nodenext` the default import of a JSON module is its whole namespace, so an `export default` sidecar types it as `{ default: … }`. Named exports work under `nodenext`, `bundler`, `preserve` and `commonjs`; keys which are not identifiers use string export names (`_3 as "x-vendor"`).
- **The type of a sidecar-typed JSON import is a module namespace, whose top-level members are not `readonly`** (everything nested is). It infers identical model types, but is not `AssertTypeEquality`-equal to the same schema declared `as const`; compare `{ readonly [K in keyof T]: T[K] }` of it instead (see `src/codegen/index.test.ts`).
- **`module: nodenext` forbids named imports from a JSON file — type-only ones too** (TS1544). That is why `--models` puts the model types of a sidecar into a separate `<name>.models.ts`, which imports the JSON with `import type schema from './x.json'` (allowed without an import attribute).
- **Once a sidecar exists, `tsc` stops copying the `.json` file to `outDir`**, as the JSON is no longer part of the program, and the emitted code fails with `ERR_MODULE_NOT_FOUND`. Consumers who emit with `tsc` must add their `.json` files to `include`; bundlers are unaffected. Documented in the README.
- **Generated `module` mode applies `satisfies` to the identifier (`export default schema satisfies …`), not to the literal.** On a fresh object literal `satisfies` runs excess property checks, rejecting keywords `JSONSchema7` does not know (2020-12's `prefixItems`, vendor `x-*` keys); on the identifier it still rejects wrong values for known keywords.
- **The `tsschema` command needs Node 22+ at the consumer** (`fs.globSync`). Deliberately documented in the README rather than declared in `engines`, which would restrict the type-only main entry too.
- **Codegen output must stay deterministic** (key order as in the JSON, `\n` line endings, no timestamps) — `--check` and the fixture freshness test compare file contents byte for byte. Every generated file starts with `// Generated by TSschema`, which `generate` requires before it overwrites an existing file.
- The recommended VS Code extension set includes `orta.vscode-twoslash-queries`, which powers the `// ^?` type-inspection comments used in sibling repos.
- **Not yet adopted:** the sibling `ts-std` repo keeps a `src/readme.spec.ts` whose `describe`/`it` tree mirrors its README headings 1:1, turning documentation examples into executable tests. This repo has no equivalent yet, although the README now documents the type exports — README samples are verified by hand (see [Verifying README samples](#verifying-readme-samples)).

## Continuous integration

`.github/workflows/ci.yml` runs `npm ci && npm run ci` on every pull request targeting `master` or `develop` and on every push to either, across a Node matrix of `[22, 24]` with `fail-fast: false`. In-progress runs are cancelled only for pull requests, never for `master`.

**Dependabot does not yet match the [branching model](#branching).** `.github/dependabot.yml` sets no `target-branch`, so Dependabot opens its pull requests against the default branch rather than `develop`.

**A workflow alone does not block merges.** Making it mandatory requires branch protection on `master` in GitHub repo settings, marking `CI / Node 22` and `CI / Node 24` as required status checks. That is a repo setting, not a file in this repository.

`.github/` also holds `pull_request_template.md` (adapted from the author's template in the `kickstart` repo) and `dependabot.yml` (weekly npm and github-actions updates, with devDependencies grouped into one pull request, and `@types/node` majors ignored).

## Exports

The public surface, re-exported from `src/index.ts`. Keep this list in sync (see [Keeping this file and README.md current](#keeping-this-file-and-readmemd-current)).

From `.` — all type-only, all from `src/types/` via `src/types/index.ts`:

- Re-exported wrappers: `TSSchemaCollection` (`TSSchemaCollection.ts`), `TSSchemaFragment` (`TSSchemaFragment.ts`), `TSSchemaProperty` (`TSSchemaProperty.ts`)
- Defined in `src/types/index.ts` itself: `TSSchemaName` (dispatches to `TSSchemaFragmentPropertyName` / `TSSchemaFragmentName`) and `TSSchemaType` (dispatches to `TSSchemaPropertyType` / `TSSchemaModelType`), plus `TSSchemaJSONSchema` / `TSSchemaJSONCollection` (aliases of the `JSONSchema7` override and `JSONSchemaCollection`, for `satisfies` checks; generated `module` mode code imports them)

From `./codegen` (`src/codegen/index.ts`), runtime: `generateFiles`, `generate`, and the types `TSSchemaCodegenMode`, `TSSchemaCodegenOptions`, `TSSchemaCodegenFile`, `TSSchemaCodegenFileStatus`, `TSSchemaCodegenResult`. `src/codegen/cli.ts` (`run`) is only reachable through the `tsschema` bin.

Generated code imports `TSSchemaFragment`, `TSSchemaType`, `TSSchemaJSONSchema` and `TSSchemaJSONCollection` from the barrel by name — renaming any of them breaks every consumer's generated files, so treat them as the most stable part of the API.

The per-module name and value type utilities (`TSSchemaFragmentName`, `TSSchemaFragmentPropertyName`, `TSSchemaModelType`, `TSSchemaPropertyType`), everything in `src/types/JSONSchema/` and the wrapper types themselves (`JSONSchema*Wrapper`, `UnwrapJSONSchema*Wrapper`) are exported per module (consumed by the other `src/types/` modules and tests) but deliberately not re-exported from the barrel — README samples must only import the barrel exports above.
