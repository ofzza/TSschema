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

## Future segments (not planned yet)

From SPEC.md section 4, each to be planned when picked up: value validation, `readOnly` / `writeOnly`, tuples and `additionalProperties`, fuller
model generation.

## Known open issues

- Making inferred model types use the generated enums (type layer change): deferred, out of scope for Segment 4.
