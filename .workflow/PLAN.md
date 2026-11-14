# Plan

How `SPEC.md` is built. Segments 1-3 record the work done before the workflow was adopted (from `README.md`, `AGENTS.md` and the git history), so
the plan describes the whole project; new work starts at Segment 4.

## Segment 1: Type inference (done, before the workflow)

Fulfils SPEC.md 2.1. Implemented in `src/schema/` (JSON schema base in `src/schema/JSONSchema/`, wrappers and `TSSchemaName` / `TSSchemaType`),
tested by type-only `*.test-d.ts` files and `src/schema/_showcase.test.ts`.

## Segment 2: Runtime reflection (done, before the workflow)

Fulfils SPEC.md 2.2. Implemented in `src/reflection/` (facets in `src/reflection/JSONSchema/`, reflections, property paths, type descriptors with
constraints, annotations), tested by runtime tests paired with type assertions.

## Segment 3: Code generation (done, before the workflow)

Fulfils SPEC.md 2.3 (without section 3). Implemented in `src/codegen/` (`generateFiles`, `generate`, the `tsschema` CLI with `--mode`, `--models`,
`--check`, `--watch`, `--out-dir`, `--import-from`), with fixtures generated into `res/` by `npm run fixtures`.

## Segment 4: Codegen enums

Fulfils SPEC.md section 3, and takes its three enum pitfalls. Full analysis (approach and complications):
`/home/ofzza/.claude/plans/i-would-like-to-clever-ladybug.md`.

### Decisions (2026-11-04)

- An enum replaces the `--models` alias of its definition (one name, both a value and a type); rejected: namespacing (`Enums.X`), suffixing.
- `enums?: false | 'enum' | 'object'`; `object` emits `export const X = { … } as const; export type X = (typeof X)[keyof typeof X];`.
- Unusable enums are skipped (no output, the alias stays); rejected: mangling names, failing generation.
- Only `$defs` enums; rejected: synthesized names for inline enums.
- Re-exports are explicit (`export { A, B } from './<stem>.enums.js';`), never `export *`.

### Steps

1. Probe in a scratch `tsc --noEmit` file: enum ⇄ inferred literal union assignability (numeric and string enums), quoted member names,
   `export { X } from './x.enums.js'` next to `--models` output.
2. `src/codegen/index.ts`: collect enums with `reflect(json)` (definitions whose `typeDescriptor.kind === 'enum'`), apply the skip rules
   (reusing `_isIdentifier`, `_RESERVED_NAMES`, `_DECLARED_NAMES`), render `<stem>.enums.ts` in either form, add explicit named re-exports to the
   main file (`module` / `types`) or to `<stem>.models.ts` (`sidecar` with `--models`), and leave the enums' aliases out of `_renderModels`.
   New `enums` option and exported `TSSchemaCodegenEnums` type.
3. `src/codegen/cli.ts`: `--enums[=enum|object]`.
4. Fixtures: `res/enum.json` gains edge cases (numeric-looking names, duplicate names, non-identifier names, `null` member, unusable
   definition name, `oneOf` enum); `fixtures:*` scripts gain `--enums`; `npm run fixtures`.
5. Tests: `src/codegen/index.test.ts` and `cli.test.ts` (both forms, all modes, skips, re-exports, compile-time compatibility of generated enums
   with the inferred models).
6. Docs: `README.md` (Code generation, type-stripping caveat, string enum cast, record keys note), `src/_showcase.test.ts`, `AGENTS.md` (Layout,
   Commands, Gotchas, Exports), and the glossary in `CONTRIBUTE.md` if a term is introduced.
7. Verify: README samples per AGENTS.md, a generated `module` file run through `node` against `dist/`, `npm run ci`.

### Implementation notes (2026-11-04)

Steps 1-7 implemented. Deviations from and additions to the steps above:

- The CLI also accepts the form as a separate argument (`--enums object`), not only `--enums=object`: without that, `--enums object` was silently
  read as a bare `--enums` plus a file pattern `object`. Only `enum` / `object` are taken as the form.
- The enums file is generated whenever the option is on, as `export {};` when the schema has no generatable enums, so an earlier one never lingers
  out of date (`generate` never deletes files).
- The probe confirmed TS2452 for numeric member names (`"1"`, `"1.5"`, `"-1"`, but not `"Infinity"` / `"NaN"`, which are skipped anyway) and
  TS2300 for duplicates; enum names like `schema` do not clash with the generated module's local `const schema`.
- No glossary term added: "enum" is used in its JSON schema / TypeScript sense.

### Open points

None.

## Segment 5: Showroom documentation (done)

Goal: use `showroom` (`@ofzza/showroom`) to make the README samples live and checked in CI.

### Decisions (2026-11-15, "Accept all recs")

- README › Runtime reflection samples become `ts showcase` blocks, logging their results to the console panel.
- The shared `schema` becomes a resource (`ts showcase file=schema.ts`), which each showcase imports.
- The "This will fail at compile time" lines get a `// @ts-expect-error` above them, so CI checks that they really fail.
- `ci:showroom` (`showroom check --showcases`) replaces the manual "Verifying README samples" process for every sample that is a showcase.
- README › Type inference and "Schemas declared as const" samples become type-checked showcases.
- Code generation samples stay plain blocks (Node only, `nodenext`), and link real generated fixtures in `res/`. Optionally, add one showcase
  that reflects `res/sidecar/schema.json`.
- No separate tsconfig for showcases unless the spike shows one is needed.
- Rewrite the README's "See it in action" note to mention the live samples. Add the README showcase conventions to AGENTS.md, and `ci:showroom` to its
  triggers table.
- `showroom.json` adds `PUBLISH.md` as a documentation page (not `AGENTS.md`).
- `package.json` `homepage` stays the GitHub URL.
- (2026-11-15, while implementing) Values and types from earlier samples are re-declared in a short preamble per showcase ("Short preamble"),
  not shared through more resources.

### Spike results (2026-11-15)

Tried in a throwaway host repository: 6 `ts` showcases converted from the README (reflection, a type descriptor walk, type inference, a
sidecar-typed fixture), plus a copy-host whose `package.json` is this package's own.

- Importing `@ofzza/tsschema` by name works from the repository root: it resolves through `exports` to `dist/`, at bundling and in the type
  check. Without `dist/` every showcase fails ("Can't resolve"), so `ci:build` must keep running before `ci:showroom`, and `npm run showroom`
  needs a build first.
- Type checking uses the root `tsconfig.json` as is, so no separate tsconfig is needed. A type error and an unused `@ts-expect-error` (TS2578)
  both fail the check, reported at their line in the Markdown.
- The `ts showcase file=schema.ts` resource works as `import { schema } from './schema.js'`, so the shared block must `export` its `schema` and
  `Schema`. Importing `res/sidecar/schema.json` works too, typed by its sidecar.
- Run in a browser, each showcase logged exactly what was expected. Logging a recursive descriptor (`Person`) is safe: its lazy `target` shows as
  `"[Circular]"`. `undefined` values show as `"[undefined]"`, so log focused values rather than whole descriptors.
- `showroom check --showcases` took about 1.4 s for the 6 showcases.

### Steps

1. README `# Usage`: turn the shared schema block into a `ts showcase file=schema.ts` resource, exporting `schema` and `Schema`.
2. README › Runtime reflection: make each sample a `ts showcase` block that imports what it uses (from `@ofzza/tsschema` and `./schema.js`),
   with a `// @ts-expect-error` above each "This will fail at compile time" line, and `console.log`s of the values its comments name.
3. README › Type inference and › Schemas declared as const: the same, type checked, each logging a small value typed by the inferred type.
4. README › Code generation: keep the `tsschema` / `people.json` samples as plain blocks, and link the generated fixtures in `res/sidecar/` and
   `res/module/`. Optionally, add one showcase reflecting `res/sidecar/schema.json`.
5. README: rewrite the "See it in action" note (live samples in the showroom, `src/_showcase.test.ts` for the asserted walk-through).
6. `showroom.json`: add `PUBLISH.md` to `documentation`.
7. AGENTS.md: in › Verifying README samples, replace the manual process with `ci:showroom` for showcase samples, keeping it for the plain
   ones (the `people.json` example); add the README showcase conventions (marker, the `@ts-expect-error` idiom, imports, build first); add a
   triggers table row (a README sample change → `npm run ci:showroom`); keep `src/_showcase.test.ts` in step with the showcases.
8. Check: `npm run ci` green, a sanity break of one showcase fails it, and a look at `npm run showroom`.

### Implementation notes (2026-11-15)

- Steps 1-7 done; the optional `res/sidecar/schema.json` showcase (step 4) was left out, keeping the README on its own schema. 14 showcases,
  `npm run ci` green; breaking a "will work" line and un-breaking a "will fail" line each fail `ci:showroom` at the right README line.
- Seen in `npm run showroom`: every showcase logs the expected values, but the showroom starts every code pane hidden, so a sample shows only its
  (unlabelled) console output until its code button is clicked, and the 5 wrapper-only samples (no logs) show as empty boxes. Raised at the checkpoint: both
  accepted as is ("Accept as is for now. Showroom will be updated with options to control how the showcase is presented"; "Keep as empty boxes").

### Open points

- [x] Spike: does a `ts showcase` importing `@ofzza/tsschema` type check under the root tsconfig, do the `schema.ts` resource import and
      `@ts-expect-error` work, and how long does `ci:showroom` take. Resolved by the spike (2026-11-15), see Spike results.

## Future segments (not planned yet)

From SPEC.md section 4, each to be planned when picked up: value validation, `readOnly` / `writeOnly`, tuples and `additionalProperties`, fuller
model generation.
Also: per-layer README pages with live internal showcases (showroom proposal 12, deferred 2026-11-15).

## Known open issues

- Making inferred model types use the generated enums (type layer change): deferred, out of scope for Segment 4.
