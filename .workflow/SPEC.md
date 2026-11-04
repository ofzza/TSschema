# Specification

What TSschema is and must do. Compiled on 2026-11-04 from the knowledge already in the repository (`README.md`, `AGENTS.md`, `CONTRIBUTE.md`,
`PUBLISH.md`), then extended with new needs. Those documents stay the detailed reference: this file states the requirements and points to them
instead of repeating them. The domain terms are defined in the glossary in `CONTRIBUTE.md` › Architecture and glossary.

## HARD RULES

The "never" rules of `AGENTS.md` on how work is done in this repository, made hard rules on 2026-11-04 (see `AGENTS.md` for each one's reason):

1. Never commit to `master` directly; it only receives merges from `develop` for a release.
2. Never commit `*.gitignore.*` files or `*.gitignore/` directories. An agent never creates either kind unless asked to.
3. Never edit generated fixtures (everything under `res/`'s subdirectories) by hand; regenerate them with `npm run fixtures`. Never edit
   `res/schema.json` by hand either: copy the sibling dotnetschema project's output over it.
4. Never use `npm ci --ignore-scripts` in this repository.
5. Never add a `paths` alias to either tsconfig.
6. Never add an `engines` field for the dev-toolchain Node floor.
7. Never import `@ofzza/tsstd` (or anything else not in `dependencies`) from a non-test source, and never add a dependency to `dependencies`
   that published `.d.ts` / `.js` files do not import.
8. Never delete, skip or weaken a test to make the suite pass.
9. Never reintroduce a term the glossary in `CONTRIBUTE.md` lists as retired.
10. Never re-export reflection names from `src/index.ts` with `export *` / `export type *`.

## 1. What the project is

TSschema, published to NPM as `@ofzza/tsschema` (MIT), helps generate TS data models, provides TS utility types for deep type inference and provides
TS runtime utilities for type reflection, all based off of a single JSON schema describing your data models (README tagline and Roadmap). It works off
a schema whose literal types are kept: declared `as const`, or generated from a `.json` file by the `tsschema` command.

## 2. Must-haves

### 2.1 Type inference (type layer, `src/schema/`)

- Infer, at compile time, from a schema: definition names, property names, and value types of a schema, a definition, a property, or a property
  addressed by a dot-separated path into nested models (`TSSchemaCollection`, `TSSchemaFragment`, `TSSchemaProperty`, `TSSchemaName`,
  `TSSchemaType`).
- Support the JSON schema keywords listed in `AGENTS.md` › Layout (`src/schema/JSONSchema/`): `type` (incl. type arrays and `null`), `const`,
  `enum`, models (`properties` / `required`), arrays, records, `allOf`, `anyOf`, `oneOf`, `not`, `$ref` into `$defs`.
- Model properties are optional unless listed in `required`; inferred types never inherit `readonly` from how the schema was declared.
- Provide `TSSchemaJSONSchema` / `TSSchemaJSONCollection` for checking an `as const` schema with `satisfies`.

### 2.2 Runtime reflection (runtime layer, `src/reflection/`)

- `reflect(schema)` navigates a schema at runtime (definitions, properties, paths) with every result fully typed by the type layer; the two layers
  must agree on every name and value type.
- Describe each fragment's type with a type descriptor (one kind per type shape, `null` as a `nullable` flag), exposing the constraints its keywords
  parse and the annotations (`title`, `description`, `default`, `deprecated`, `examples`, `x-decorators`) of the position it is used at.
- Recognise enums written as `enum`, `enum` + `x-enumNames`, and a `oneOf` of titled `const`s (the dotnetschema idiom).
- Only `reflect`, the reflection classes, the descriptor, constraint and annotation types (as types) are public; everything else is internal.

### 2.3 Code generation (`src/codegen/`, the `tsschema` command and `@ofzza/tsschema/codegen`)

- Turn JSON schema files into TypeScript that keeps their literal types, in three modes: `sidecar` (`<name>.d.json.ts`), `module` (an `as const`
  module) and `types` (a types-only module).
- Optionally (`--models`) generate a `Models` map type and a named type alias per definition.
- `--check` (for CI) and `--watch`; never overwrite a file it did not generate; refuse two sources generating the same file; deterministic output.
- **New: enums**, see section 3.

### 2.4 Packaging and quality

- ESM only; only `dist/` is published; Node-only code stays out of the main entry; `dependencies` only hold what published files import
  (`AGENTS.md` › Project, Gotchas).
- Supported toolchain: Node 22.13+ / 24+ for development and the `tsschema` command; the main entry is type-only plus `reflect`.
- Every commit passes `npm run ci` (build, ESLint, Prettier, tests with type checks), on Node 22 and 24 in GitHub Actions.
- Documentation (`README.md`, `CONTRIBUTE.md`, `AGENTS.md`, `PUBLISH.md`), showcases and tests are kept current with every change
  (`AGENTS.md` › Keeping documentation, showcases and tests current).
- Public API is still unstable below `1.0.0`; package metadata may describe the intended scope until then.

## 3. Codegen: enums (new, 2026-11-04)

Code generation, in all three modes, can optionally also generate the enums found in the JSON schema file as runtime values (not only as types), in
a separate `<name>.enums.ts` file re-exported by the main generated file, keeping the types apart from the enums.

- An option (`enums`, CLI `--enums`), off by default, in all three modes.
- TS `enum`s (`--enums` / `enums: 'enum'`), and as an alternative an `as const` object plus a type of the same name (`--enums=object` /
  `enums: 'object'`), which is erasable syntax.
- Only `$defs` enums, in every idiom reflection recognises (2.2).
- An enum replaces the `--models` type alias of its definition.
- An enum which can not be generated validly (unusable definition or member names, duplicate names, values other than strings / numbers) is
  skipped.
- In `sidecar` mode the enums are re-exported from `<name>.models.ts` when `--models` is on, as a `.d.json.ts` can not re-export values;
  otherwise `<name>.enums.ts` is imported directly.

## 4. Ideas and wishes (Roadmap, not yet must-haves)

- Validating values against a reflected schema.
- The `readOnly` and `writeOnly` keywords (in inference and reflection).
- Tuples and `additionalProperties`, in the type utilities and type descriptors alike.
- Fuller model generation beyond `--models` type aliases.

## 5. Deliberate non-goals

Decided against, not missing (see `AGENTS.md` › Gotchas and known issues):

- Constraints and annotations never change inferred value types.
- `TSSchemaName` never infers property paths, and no depth-limited path union is offered elsewhere.
- No `engines` field restricting consumers.

## 6. Time and complexity budget

Small: a focused library (2026-11-04). At most one zero-context review before each segment is implemented.

## Pitfalls

- **Type layer and runtime layer drifting apart.** Every runtime result is typed by the type layer, so a change to one without its mirror breaks
  the agreement silently in places tests don't cover. Mitigated by pairing runtime `expect`s with `AssertTypeEquality`.
- **TypeScript type complexity limits.** Deeply recursive inference over large schemas can hit instantiation depth / union size limits; reasons why
  constraints are kept out of value types.
- **Enums are not erasable syntax** (section 3). Node's TS type stripping and `erasableSyntaxOnly` reject `enum`; `types` mode output stops being
  types only. Mitigated by the `object` form, and documented in the README. Taken by `PLAN.md` › Segment 4.
- **Enum types vs inferred model types** (section 3). Models keep inferring literal unions; string literals are not assignable to string enums, so
  reading a model's value into a string enum needs a cast. To be probed with `tsc` and documented. Taken by `PLAN.md` › Segment 4.
- **`export *` silently loses a name** shadowed by a local export, so generated re-exports must be explicit. Taken by `PLAN.md` › Segment 4.

## Open points

- [x] Time and complexity budget (section 6): resolved 2026-11-04, "Small".
- [x] HARD RULES: resolved 2026-11-04, "All of them are hard rules" (`AGENTS.md`'s "never" rules on how work is done).
