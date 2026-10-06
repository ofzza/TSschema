# TSschema

Helps generate TS data models, provides TS utility types for deep type inference and provides TS runtime utilities for type reflection, all based off of a JSON schema.

---

Jump to section:

- [Get TSschema](#get-tsschema)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Development](#development)
- [Contributing](#contributing)

# Get TSschema

To start using `TSschema` in your project, simply install it from NPM by running the following in your terminal:

```sh
$ npm install @ofzza/tsschema --save
```

# Usage

`TSschema` currently exports type-only utilities for deep type inference from a JSON schema, all imported from `@ofzza/tsschema`. They work off of a
schema whose literal types are kept, such as a schema declared `as const`. A schema kept in a `.json` file loses its literal types when imported, so
`TSschema` also comes with a `tsschema` command generating the types for it - see [Schemas from JSON files](#schemas-from-json-files).

A few terms used below:

- A **collection** is a schema defining its **fragments** (models, enums, ...) in `$defs`. Fragments reference one another as `{ $ref: '#/$defs/<name>' }`.
- A **model** is an object fragment with `properties`.
- A **wrapper** holds on to a fragment (or a property) together with its context: the collection it came from, its name and, for a property, its parent
  model. This lets any `$ref` it contains be resolved later.

The examples below all use this schema:

```ts
import type { TSSchemaCollection, TSSchemaFragment, TSSchemaProperty, TSSchemaName, TSSchemaType, TSSchemaJSONCollection } from '@ofzza/tsschema';

const schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        role: { $ref: '#/$defs/Role' },
      },
    },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;
```

## TSSchemaCollection

`TSSchemaCollection<TCollection>` wraps a collection. Anywhere a collection is accepted below, its wrapper can be used in its place (and so can any other
wrapper, standing in for the collection it came from):

```ts
type People = TSSchemaCollection<Schema>; // This will work
```

## TSSchemaFragment

`TSSchemaFragment<TCollection, TName>` wraps the fragment named `TName` of a collection, together with the collection and its name. The name is checked
against the collection. A union of names wraps each named fragment, and omitting the name wraps every fragment, both resulting in a union of wrappers:

```ts
type Person = TSSchemaFragment<People, 'Person'>; // This will work
type PersonOrRole = TSSchemaFragment<Schema, 'Person' | 'Role'>; // This will work
type AnyFragment = TSSchemaFragment<Schema>; // This will work
type Teacher = TSSchemaFragment<People, 'Teacher'>; // This will fail at compile time
```

`TSSchemaFragment<TFragment>` wraps a fragment given directly. It has no collection to resolve its `$ref`s against:

```ts
type StandalonePerson = TSSchemaFragment<Schema['$defs']['Person']>; // This will work
```

## TSSchemaProperty

`TSSchemaProperty` wraps a property of a model, together with the model and, when known, the model's name and collection. The property can be addressed:

- from a collection, by model and property name: `TSSchemaProperty<TCollection, TModelName, TName>`,
- from a fragment wrapper, by property name: `TSSchemaProperty<TFragmentWrapper, TName>`,
- from a model given directly, by property name: `TSSchemaProperty<TModel, TName>` (with no collection to resolve its `$ref`s against).

Names are checked against the schema. As with `TSSchemaFragment`, a union of names wraps each named property, and omitting the name wraps every property:

```ts
type PersonName = TSSchemaProperty<Person, 'name'>; // This will work
type PersonAge = TSSchemaProperty<Schema, 'Person', 'age'>; // This will work
type StandalonePersonRole = TSSchemaProperty<Schema['$defs']['Person'], 'role'>; // This will work
type AnyPersonProperty = TSSchemaProperty<Schema, 'Person'>; // This will work
type PersonEmail = TSSchemaProperty<Person, 'email'>; // This will fail at compile time
```

A fragment which is not a model has no properties to wrap. A model given directly with no name is itself wrapped as a property, e.g. for an inline
nested model.

## TSSchemaName

`TSSchemaName<T>` infers the names addressable within what it is given:

- a collection infers the names of its fragments,
- a model, a fragment wrapper or a property wrapper infers the names of the (parent) model's properties,
- a wrapper of a fragment which is not a model infers `never`.

```ts
type FragmentName = TSSchemaName<Schema>; // 'Person' | 'Role'
type PropertyName = TSSchemaName<TSSchemaFragment<Schema, 'Person'>>; // 'name' | 'age' | 'role'
type SiblingPropertyName = TSSchemaName<PersonAge>; // 'name' | 'age' | 'role'
type RoleName = TSSchemaName<TSSchemaFragment<Schema, 'Role'>>; // never
```

## TSSchemaType

`TSSchemaType<T, TCollection?>` infers the value type of what it is given:

- a property wrapper infers the type of the property (not of its parent model),
- a fragment wrapper or a fragment given directly infers the type of the fragment.

`$ref`s resolve against the wrapper's own collection, unless a collection is passed explicitly as the second argument, which takes precedence. A
fragment given directly, or wrapped with no collection, only resolves `$ref`s against an explicitly passed collection. Otherwise each of its `$ref`s
infers `unknown`:

```ts
type PersonType = TSSchemaType<Person>; // { name: string; age: number; role: 'student' | 'teacher' }
type AgeType = TSSchemaType<PersonAge>; // number
type RoleType = TSSchemaType<TSSchemaProperty<Schema, 'Person', 'role'>>; // 'student' | 'teacher'
type UnresolvedRoleType = TSSchemaType<StandalonePersonRole>; // unknown
type ResolvedRoleType = TSSchemaType<StandalonePersonRole, Schema>; // 'student' | 'teacher'

const person: PersonType = { name: 'Ada', age: 36, role: 'teacher' }; // This will work
const role: RoleType = 'principal'; // This will fail at compile time
```

## TSSchemaJSONSchema and TSSchemaJSONCollection

`TSSchemaJSONSchema` represents any JSON schema, and `TSSchemaJSONCollection` a collection. Both make every property optionally read-only, so a schema
declared `as const` can be checked against them with `satisfies` without losing its literal types. Apply `satisfies` to the declared constant rather than
to the object literal itself, so keywords these types do not know about (newer drafts, vendor extensions) are not rejected as excess properties:

```ts
const people = { $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } } } as const;
const checkedPeople = people satisfies TSSchemaJSONCollection; // This will work

const invalid = { $defs: { Person: { type: 'text' } } } as const;
const checkedInvalid = invalid satisfies TSSchemaJSONCollection; // This will fail at compile time
```

## Schemas from JSON files

TypeScript types a JSON import loosely (`"type": "object"` becomes `string`), which loses everything the utilities above infer from. The `tsschema`
command, installed with the package, generates TypeScript files that keep the literal types of a JSON schema file:

```sh
$ npx tsschema generate --models "src/**/*.schema.json"
```

It supports three output modes, selected with `--mode`:

- **`sidecar`** (default) generates `<name>.d.json.ts` next to `<name>.json`. TypeScript then uses it as the type of the JSON file itself, so you keep
  importing the `.json` file and its runtime value stays the JSON file's content. This requires `allowArbitraryExtensions` (TypeScript 5.0+):

  ```jsonc
  // tsconfig.json
  {
    "compilerOptions": { "allowArbitraryExtensions": true, "resolveJsonModule": true },
    // Only needed when tsc emits your code (not with a bundler): with a sidecar present, tsc no longer copies the .json file to outDir by itself
    "include": ["src/**/*.ts", "src/**/*.json"],
  }
  ```

- **`module`** generates `<name>.schema.ts`, exporting the schema as an `as const` value (checked against the `TSSchemaJSONCollection` /
  `TSSchemaJSONSchema` types with `satisfies`). It works with any TypeScript configuration, at the cost of copying the schema into your code.
- **`types`** generates `<name>.schema.ts`, exporting only the schema's type as `Schema`, for when the schema itself is not needed at runtime.

With `--models`, a `Models` map type and a named type alias per fragment are generated too: into `<name>.models.ts` in the `sidecar` mode (as
`module: nodenext` does not allow named imports from a JSON file), or into the `<name>.schema.ts` module otherwise. A fragment whose name is not a valid
type alias name (e.g. `kebab-name`) is only available as `Models['kebab-name']`. A schema which is not a collection gets a single `Model` type instead.

With `src/people.json` containing the schema above, `npx tsschema generate --models src/people.json` lets you write:

```ts
import schema from './people.json' with { type: 'json' };
import type { Person } from './people.models.js';
import type { TSSchemaFragment, TSSchemaType } from '@ofzza/tsschema';

type Role = TSSchemaType<TSSchemaFragment<typeof schema, 'Role'>>; // 'student' | 'teacher'

const person: Person = { name: 'Ada', age: 36, role: 'teacher' }; // This will work
const role: Role = 'principal'; // This will fail at compile time
```

Generated files have to be regenerated whenever their JSON file changes, so:

- run `tsschema generate` before building or type checking (e.g. from a `prebuild` npm script), or keep `tsschema generate --watch` running while
  working. Watching covers the directories of the matched files and the fixed part of each pattern; restart it after adding a new directory,
- commit the generated files, and run `tsschema generate --check` in CI, which exits with `1` if any of them is out of date.

A missing sidecar is caught at compile time, since the loosely typed JSON is rejected by the utilities, but a stale one is not. `tsschema` refuses to
overwrite a file it did not generate. Run `npx tsschema --help` for all options, including `--out-dir` and `--import-from`. The same code generation is
available programmatically, from `@ofzza/tsschema/codegen`: `generateFiles(sourcePath, json, options)` returns the generated files without touching
the file system, and `generate(sourcePaths, options)` writes them (or, with `check: true`, only reports which are stale). The command requires Node 22
or newer.

# Roadmap

`TSschema` is being built towards the following scope, all driven by a single JSON schema describing your data models:

- **Deep type inference** - utility types inferring model names, property names, property paths and their types directly from the schema, at compile
  time. Partly available, see [Usage](#usage). Property paths are not yet supported.
- **Model generation** - generating TypeScript data model definitions from the JSON schema. Partly available: `tsschema generate --models` generates a
  named type per fragment, see [Schemas from JSON files](#schemas-from-json-files).
- **Runtime reflection** - runtime utilities for inspecting the same model, property and path information the utility types infer. Planned.

# Development

- `npm run build` - cleans `dist/` (`npm run clean`), then compiles `src/` into it, emitting declarations. Also run on `prepare`, so a local `npm install` builds too.
- `npm run dev` - the same, in watch mode.
- `npm run fixtures` - builds, then regenerates the test fixtures in `res/` from `res/*.json` with the built `tsschema` command: sidecars and model types
  next to each JSON file, and the `module` / `types` mode outputs into `res/module/` / `res/types/`. Run it after changing a fixture or the code generation;
  the tests fail while any generated fixture is out of date.
- `npm test` - runs every `test:*` script.
  - `npm run test:unit` - a single Vitest invocation that executes test files, runs their runtime expectations, and type checks them, reporting type errors as test failures.
- `npm run ci` - runs every `ci:*` script: build, ESLint, Prettier and the tests. This is what GitHub Actions runs on every pull request targeting `master` or `develop` and on every push to either, against Node 22 and 24. It also runs on `prepublishOnly`, so `npm publish` refuses to publish a failing build.

To release a new version, follow the checklist and steps in [PUBLISH.md](PUBLISH.md).

# Contributing

For reporting issues, contribution workflow and branching, see [CONTRIBUTE.md](./CONTRIBUTE.md).
