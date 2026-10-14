# TSschema

[![npm](https://img.shields.io/npm/v/@ofzza/tsschema)](https://www.npmjs.com/package/@ofzza/tsschema)

Helps generate TS data models, provides TS utility types for deep type inference and provides TS runtime utilities for type reflection, all based off of a JSON schema.

---

Jump to section:

- [Get TSschema](#get-tsschema)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Development](#development)
- [Contributing](#contributing)

# Get TSschema

To start using `TSschema` in your project, simply install it from [NPM](https://www.npmjs.com/package/@ofzza/tsschema) by running the following in your terminal:

```sh
$ npm install @ofzza/tsschema --save
```

# Usage

> **See it in action:** [`src/_showcase.test.ts`](src/_showcase.test.ts) walks through every example below as a runnable, type checked test file. Open it
> in an editor with twoslash query support (e.g. VS Code with the `orta.vscode-twoslash-queries` extension) to see every inferred type live.

`TSschema` works off of a JSON schema whose literal types are kept, such as a schema declared `as const`, and offers:

- [Runtime reflection](#runtime-reflection): navigating a schema at runtime - its definitions, their properties and paths into nested models - and
  describing their types, with every result fully typed,
- [Code generation](#code-generation-schemas-from-json-files): getting a schema with its literal types into TypeScript, declared `as const` or
  generated from a `.json` file by the `tsschema` command,
- [Type inference](#type-inference): the type utilities underneath, inferring names and value types from a schema at compile time, for building your
  own extensions of the runtime behaviour.

A few terms used below:

- A **fragment** is any part of a schema that is a schema itself: the schema, a definition, a property, an `anyOf` member, an array's `items`, ...
- A **collection** is a schema defining named fragments, its **definitions** (models, enums, ...), in `$defs`. Definitions reference one another as
  `{ $ref: '#/$defs/<name>' }`.
- A **model** is an object fragment with `properties`.
- A **path** is a dot-separated list of property names, addressing a property of a nested model (e.g. `'mentor.age'`).
- A **constraint** is a validation keyword limiting the values of a type (`minimum`, `maxLength`, `format`, `maxItems`, ...), and an **annotation** a
  keyword describing a fragment (`title`, `description`, `default`, ...) or one of its **decorators**, listed by the `x-decorators` vendor keyword.

The examples below all use this schema:

```ts
const schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: {
        name: { type: 'string', title: 'Full name', minLength: 1, 'x-decorators': [{ name: 'Required' }] },
        age: { type: 'integer', minimum: 0, format: 'int32' },
        role: { $ref: '#/$defs/Role' },
        mentor: { anyOf: [{ $ref: '#/$defs/Person' }, { type: 'null' }] },
      },
      required: ['name', 'age', 'role'],
    },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;
```

## Runtime reflection

`reflect(schema)` reflects a schema, from which its definitions and their properties are reflected in turn. Each reflection is typed by the part of the
schema it reflects, so names are checked and value types inferred, exactly as by the [type utilities](#type-inference).

### reflect

`reflect` reflects a schema's root. For a collection, it gives access to the collection's definitions by name:

```ts
import { reflect } from '@ofzza/tsschema';

const root = reflect(schema); // This will work
const definitionNames = root.definitionNames; // ['Person', 'Role']
```

### Definitions

`getDefinition(name)` reflects a definition of the collection, from any reflection of the same schema. The name is checked against the collection, and
`Type` (used as `typeof reflection.Type`, it holds no value) infers the definition's value type:

```ts
const person = root.getDefinition('Person'); // This will work
const personName = person.name; // 'Person'
type PersonValue = typeof person.Type; // { name: string; age: number; role: 'student' | 'teacher'; mentor?: PersonValue | null }
const teacher = root.getDefinition('Teacher'); // This will fail at compile time
```

### Properties and paths

`getProperty(name)` reflects a property of a model, and `getProperty(path)` a property of a nested model. A property reflection knows its `name`, its
`parent` (the reflection it was looked up from, or for a path the property the path leads through) and whether it is `required` by its model:

```ts
const propertyNames = person.propertyNames; // ['name', 'age', 'role', 'mentor']
const personAge = person.getProperty('age'); // This will work
const ageRequired = personAge.required; // true
type AgeValue = typeof personAge.Type; // number

const mentorAge = person.getProperty('mentor.age'); // This will work, through the nullable reference
const mentor = mentorAge.parent; // the same property as person.getProperty('mentor')
const mentorRequired = mentor.required; // false
const nameLength = person.getProperty('name.length'); // undefined, as `name` is not a model
const email = person.getProperty('email'); // This will fail at compile time
```

Properties are looked up in every model the reflected part of the schema leads to: through `$ref`s, every member of an `anyOf`, `oneOf` or `allOf` (e.g.
a nullable reference, as `mentor` above, or a nullable model, `type: ['object', 'null']`), and the `items` of an array. A property defined by several of
those models (e.g. both members of an `anyOf`) is reflected once, as a property which is required only if every model requires it. A name containing a
dot which a model defines as is wins over a path. Only a path's first segment is checked at compile time, as a recursive schema (`Person.mentor` →
`Person`) has infinitely many valid paths; a path which does not lead to a property reflects `undefined`. Within an object whose properties are not known (an
object with no `properties`, a `$ref` which can not be resolved, or an array with no single schema `items`), any name is a property of type `unknown`.

### Type descriptors

Every reflection's `typeDescriptor` describes its type at runtime: what `Type` infers at compile time, as a tree of plain objects told apart by their
`kind` - `unknown`, `const`, `enum`, `primitive`, `null`, `array`, `record` (an object with no `properties`), `model`, `reference`, `anyOf`, `allOf`,
`oneOf` and `not`. Every kind also has a `nullable` flag, and a model holds each property as whether it is `required`, its `type` and its `annotations`
(see [Constraints and annotations](#constraints-and-annotations)). Like everything else, it is typed by the schema, down to its literal kinds, values,
property names and flags:

```ts
import type { TSSchemaTypeDescriptor } from '@ofzza/tsschema';

const personType = person.typeDescriptor; // { kind: 'model', properties: { name: …, age: …, role: …, mentor: … }, required: ['name', 'age', 'role'], constraints: { … }, nullable: false }
const age = personType.properties.age; // { required: true, type: { kind: 'primitive', type: 'integer', constraints: { minimum: 0, … }, nullable: false }, annotations: { … } }
const roleType = personType.properties.role.type; // { kind: 'reference', name: 'Role', target: { kind: 'enum', … }, nullable: false }
const roleNames = roleType.target.names; // ['student', 'teacher']
const mentorType = personType.properties.mentor.type; // { kind: 'reference', name: 'Person', target: …, nullable: true }
const emailType = personType.properties.email; // This will fail at compile time

function typeName(descriptor: TSSchemaTypeDescriptor): string {
  switch (descriptor.kind) {
    case 'primitive':
      return descriptor.type; // This will work, `kind` narrows the descriptor
    case 'reference':
      return descriptor.name;
    case 'array':
      return `${typeName(descriptor.items)}[]`;
    default:
      return descriptor.kind;
  }
}
```

`null` alongside other types is not described as an alternative but by `nullable`: `type: ['string', 'null']`, `anyOf: [{ type: 'string' }, { type:
'null' }]` and `enum: ['a', null]` are a nullable string, a nullable string and a nullable enum of `'a'`; `null` alone is the `null` kind (always
`nullable`). An `anyOf` (or `allOf`) is also nullable if any (every) member is, and a `oneOf` if exactly one is, but `null` is never taken out of a
`oneOf`, where it would change what the schema accepts. `nullable` only says what is stated where the descriptor is used: a reference is nullable if
`null` is next to it, whatever the referenced definition says, and `unknown` (which accepts anything) and `not` are not, unless `null` is next to
them.

A `$ref` is described by the definition's name and, lazily on access, its `target`: the same descriptor as the definition's own (within one reflected
schema), so a recursive schema (`Person.mentor` → `Person`) is described without recursing forever. An `enum` names its values by an `x-enumNames`
keyword next to it, or else each value by itself; a `oneOf` of `const` fragments only (e.g. `oneOf: [{ const: 0, title: 'Quiz' }, …]`) is described as
an `enum` too, named by each fragment's `title`. A fragment with several keywords is described as an implicit `allOf` of them (`implicit: true`),
except that an `enum` or `const` absorbs the `type` next to it, and a `type` array naming several types other than `null` as an implicit `anyOf` of
them. Tuples are not described yet (an array of `unknown` items), nor `additionalProperties` (a `record` of `unknown` values).

### Constraints and annotations

Validation keywords are kept as the `constraints` of the type descriptors they apply to, as JSON Schema applies most of them only to values of one type:
a `primitive` number (`minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`) or string (`minLength`, `maxLength`, `pattern`,
`contentEncoding`), an `array` (`minItems`, `maxItems`, `uniqueItems`), and a `record` or `model` (`minProperties`, `maxProperties`). `format` applies
to values of any type (JSON Schema predefines string formats only, but allows custom ones, e.g. `int32` or `decimal` for a number), so every one of
these holds it, a `boolean` nothing else. Every keyword is always there, `undefined` if the schema has none, and a `type` array naming several types
gives each of them only its own (and `format`):

```ts
const ageConstraints = personType.properties.age.type.constraints; // { minimum: 0, maximum: undefined, …, format: 'int32' }
const nameConstraints = personType.properties.name.type.constraints; // { minLength: 1, maxLength: undefined, pattern: undefined, … }
const ageMaxLength = ageConstraints.maxLength; // This will fail at compile time, a number has no `maxLength`
```

Annotations describe where a fragment is used rather than its type, so they are read from the fragment itself, never through a `$ref` (a property's
`title` next to a `$ref` is the property's, not the definition's). Every reflection has its `annotations`, and each of them as a getter of its own:
`title`, `description`, `default`, `deprecated`, `examples` (each `undefined` if the fragment has none) and `decorators` (an empty array if it has
none). A model's type descriptor holds the `annotations` of each of its properties too:

```ts
const nameProperty = person.getProperty('name');
const nameTitle = nameProperty.title; // 'Full name'
const nameDecorators = nameProperty.decorators; // [{ name: 'Required', arguments: {}, properties: {} }]
const nameAnnotations = personType.properties.name.annotations; // { title: 'Full name', description: undefined, …, decorators: [{ name: 'Required', … }] }
const roleTitle = person.getProperty('role').title; // undefined
```

Decorators are listed by the `x-decorators` vendor keyword, as written by the sibling [DotNetSchema](https://github.com/ofzza/DotNetSchema) project
for the .NET attributes of a type or property: each by its `name`, the `arguments` it was constructed with, and the `properties` it was initialized with
(both empty objects if there are none). A property found in several models (e.g. both members of an `anyOf`) has no annotations of its own: look them up
on each model's property instead.

Neither constraints nor annotations change the value types inferred by `Type` or the [type utilities](#type-inference), by design: TypeScript can not
express most constraints (string lengths, patterns, number ranges), and the ones it could (e.g. a `format` as a template literal type, or `minItems` as a
tuple) would make plain `string`s or arrays no longer assignable, and grow costly to check.

### Coming next

Reflection currently navigates and describes a schema. Still to come:

- validating values against a reflected schema,
- the `readOnly` and `writeOnly` keywords,
- tuples and `additionalProperties`, in the type utilities and type descriptors alike.

The reflection classes (`TSSchemaFragmentReflection`, `TSSchemaDefinitionReflection` and `TSSchemaPropertyReflection`) are exported as types only, for
annotating your own code: create reflections with `reflect`, and check what a reflection is by its properties rather than with `instanceof`. The type
descriptor types (`TSSchemaTypeDescriptor`, one per kind, e.g. `TSSchemaModelTypeDescriptor`, and `TSSchemaModelPropertyDescriptor`) are exported as
types too, and so are their constraints (`TSSchemaConstraints`, the `format` every kind of constraints extends, and one per kind of values, e.g.
`TSSchemaNumberConstraints`).

## Code generation: Schemas from JSON files

Everything `TSschema` infers comes from a schema's literal types. A schema declared in TypeScript keeps them when declared `as const`. A schema kept in
a `.json` file does not: TypeScript types a JSON import loosely (`"type": "object"` becomes `string`), so the `tsschema` command generates the types it
is missing.

### Schemas declared as const

`TSSchemaJSONSchema` represents any JSON schema, and `TSSchemaJSONCollection` a collection. Both make every property optionally read-only, so a schema
declared `as const` can be checked against them with `satisfies` without losing its literal types. Apply `satisfies` to the declared constant rather than
to the object literal itself, so keywords these types do not know about (newer drafts, vendor extensions) are not rejected as excess properties:

```ts
import type { TSSchemaJSONCollection } from '@ofzza/tsschema';

const people = { $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } } } as const;
const checkedPeople = people satisfies TSSchemaJSONCollection; // This will work

const invalid = { $defs: { Person: { type: 'text' } } } as const;
const checkedInvalid = invalid satisfies TSSchemaJSONCollection; // This will fail at compile time
```

### The tsschema command

The `tsschema` command, installed with the package, generates TypeScript files that keep the literal types of a JSON schema file. It requires Node 22 or
newer:

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

A JSON file whose name already is or ends with `schema` does not get the suffix twice: `schema.json` generates `schema.ts`, and `user.schema.json`
generates `user.schema.ts`. Two JSON files which would generate the same file (e.g. `user.json` and `user.schema.json` side by side) are refused.

With `--models`, a `Models` map type and a named type alias per definition are generated too: into `<name>.models.ts` in the `sidecar` mode (as
`module: nodenext` does not allow named imports from a JSON file), or into the `<name>.schema.ts` module otherwise. A definition whose name is not a valid
type alias name (e.g. `kebab-name`) is only available as `Models['kebab-name']`. A schema which is not a collection gets a single `Model` type instead.

With `src/people.json` containing the schema above, `npx tsschema generate --models src/people.json` lets you write:

```ts
import schema from './people.json' with { type: 'json' };
import type { Person } from './people.models.js';
import { reflect, type TSSchemaFragment, type TSSchemaType } from '@ofzza/tsschema';

type Role = TSSchemaType<TSSchemaFragment<typeof schema, 'Role'>>; // 'student' | 'teacher'

const person: Person = { name: 'Ada', age: 36, role: 'teacher' }; // This will work
const role: Role = 'principal'; // This will fail at compile time
const age = reflect(schema).getDefinition('Person').getProperty('age'); // This will work, reflecting the JSON file's content
```

Generated files have to be regenerated whenever their JSON file changes, so:

- run `tsschema generate` before building or type checking (e.g. from a `prebuild` npm script), or keep `tsschema generate --watch` running while
  working. Watching covers the directories of the matched files and the fixed part of each pattern; restart it after adding a new directory,
- commit the generated files, and run `tsschema generate --check` in CI, which exits with `1` if any of them is out of date.

A missing sidecar is caught at compile time, since the loosely typed JSON is rejected by the utilities, but a stale one is not. `tsschema` refuses to
overwrite a file it did not generate. Run `npx tsschema --help` for all options, including `--out-dir` and `--import-from`.

### Programmatic use

The same code generation is available programmatically, from `@ofzza/tsschema/codegen`: `generateFiles(sourcePath, json, options)` returns the
generated files without touching the file system, and `generate(sourcePaths, options)` writes them (or, with `check: true`, only reports which are
stale). Like the command, it requires Node 22 or newer.

## Type inference

The type utilities infer everything the runtime reflection is typed by, from a schema alone, at compile time. Use them directly to type your own code
working with a schema, e.g. extensions or overrides of the runtime behaviour, with full IDE support. They are all type-only:

```ts
import type { TSSchemaCollection, TSSchemaFragment, TSSchemaProperty, TSSchemaName, TSSchemaType } from '@ofzza/tsschema';
```

Most of them work with **wrappers**: a wrapper holds on to a fragment (or a property) together with its context - the collection it came from, its name
and, for a property, its parent model - so that any `$ref` it contains can be resolved later.

### TSSchemaCollection

`TSSchemaCollection<TCollection>` wraps a collection. Anywhere a collection is accepted below, its wrapper can be used in its place (and so can any other
wrapper, standing in for the collection it came from):

```ts
type People = TSSchemaCollection<Schema>; // This will work
```

### TSSchemaFragment

`TSSchemaFragment<TCollection, TName>` wraps the definition named `TName` of a collection, together with the collection and its name. The name is
checked against the collection. A union of names wraps each named definition, and omitting the name wraps every definition, both resulting in a union of
wrappers:

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

### TSSchemaProperty

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

In place of a property name, a dot-separated path addresses a property of a nested model. The property is wrapped together with that nested model,
exactly as if it had been addressed from it directly. A path goes into a nested model given inline or by `$ref`, through every member of an `anyOf`,
`oneOf` or `allOf` (e.g. a nullable reference), through the `items` of an array, and into the `object` or `array` part of a `type` array (e.g. a
nullable model, `type: ['object', 'null']`):

```ts
type MentorName = TSSchemaProperty<Person, 'mentor.name'>; // This will work, same as TSSchemaProperty<Schema, 'Person', 'name'>
type MentorMentorAge = TSSchemaProperty<Schema, 'Person', 'mentor.mentor.age'>; // This will work
type MentorEmail = TSSchemaProperty<Person, 'email.address'>; // This will fail at compile time
```

Only a path's first segment is checked at compile time: a recursive schema (`Person.mentor` → `Person`) has infinitely many valid paths, so they can not
all be listed (for the same reason, [TSSchemaName](#tsschemaname) infers no paths). A path which does not address a property further down (e.g.
`'mentor.email'`, or `'name.length'` into a property which is not a model) infers `never`. A path into an object whose shape is not known (an object
with no `properties`, a `$ref` with no collection to resolve it against, or an array with no single schema `items`) wraps a property of type `unknown`.

### TSSchemaName

`TSSchemaName<T>` infers the names addressable within what it is given:

- a collection infers the names of its definitions,
- a model, a fragment wrapper or a property wrapper infers the names of the (parent) model's properties,
- a wrapper of a fragment which is not a model infers `never`.

It infers direct names only, never dot-separated paths into nested models: a recursive schema (`Person.mentor` → `Person`) has infinitely many of them.
Paths can still address properties, see [TSSchemaProperty](#tsschemaproperty).

```ts
type DefinitionName = TSSchemaName<Schema>; // 'Person' | 'Role'
type PropertyName = TSSchemaName<TSSchemaFragment<Schema, 'Person'>>; // 'name' | 'age' | 'role' | 'mentor'
type SiblingPropertyName = TSSchemaName<PersonAge>; // 'name' | 'age' | 'role' | 'mentor'
type RoleName = TSSchemaName<TSSchemaFragment<Schema, 'Role'>>; // never
```

### TSSchemaType

`TSSchemaType<T, TCollection?>` infers the value type of what it is given:

- a property wrapper infers the type of the property (not of its parent model),
- a fragment wrapper or a fragment given directly infers the type of the fragment.

`$ref`s resolve against the wrapper's own collection, unless a collection is passed explicitly as the second argument, which takes precedence. A
fragment given directly, or wrapped with no collection, only resolves `$ref`s against an explicitly passed collection. Otherwise each of its `$ref`s
infers `unknown`.

Sibling keywords narrow each other (e.g. `type: 'integer'` with an `enum`), `allOf` infers the intersection of its members, and `anyOf` / `oneOf` the
union of their members (a type can not tell "exactly one" from "at least one", so `oneOf` infers the same as `anyOf`).

A model's properties listed in its `required` keyword are required, and all other properties are optional (`key?:`). So a model with no `required`
infers every property as optional, as does one whose `required` is not a list of literal names. The type of a property itself never includes
`undefined`: whether it may be missing is up to its model. Here, `mentor` is not listed in `required`:

```ts
type PersonType = TSSchemaType<Person>; // { name: string; age: number; role: 'student' | 'teacher'; mentor?: PersonType | null }
type AgeType = TSSchemaType<PersonAge>; // number
type MentorAgeType = TSSchemaType<MentorMentorAge>; // number
type RoleType = TSSchemaType<TSSchemaProperty<Schema, 'Person', 'role'>>; // 'student' | 'teacher'
type UnresolvedRoleType = TSSchemaType<StandalonePersonRole>; // unknown
type ResolvedRoleType = TSSchemaType<StandalonePersonRole, Schema>; // 'student' | 'teacher'

const ada: PersonType = { name: 'Ada', age: 36, role: 'teacher' }; // This will work
const nameless: PersonType = { age: 36, role: 'teacher' }; // This will fail at compile time
const role: RoleType = 'principal'; // This will fail at compile time
```

# Roadmap

`TSschema` is being built towards the following scope, all driven by a single JSON schema describing your data models:

- **Deep type inference** - utility types inferring model names, property names, property paths and their types directly from the schema, at compile
  time. Partly available, see [Type inference](#type-inference). Property paths address properties (see [TSSchemaProperty](#tsschemaproperty)), while
  [TSSchemaName](#tsschemaname) deliberately infers direct names only, never paths.
- **Model generation** - generating TypeScript data model definitions from the JSON schema. Partly available: `tsschema generate --models` generates a
  named type per definition, see [Code generation](#code-generation-schemas-from-json-files).
- **Runtime reflection** - runtime utilities for inspecting the same model, property and path information the utility types infer. Partly
  available: navigating a schema's definitions, properties and paths, and describing their types, see [Runtime reflection](#runtime-reflection).
  Validating values is still to come.

# Development

- `npm run build` - cleans `dist/` (`npm run clean`), then compiles `src/` into it, emitting declarations. Also run on `prepare`, so a local `npm install` builds too.
- `npm run dev` - the same, in watch mode.
- `npm run fixtures` - builds, then regenerates the test fixtures from the JSON schemas in `res/` with the built `tsschema` command: copies of the JSON
  files with their sidecars and model types into `res/sidecar/`, and the `module` / `types` mode outputs into `res/module/` / `res/types/`. Run it after
  changing a fixture or the code generation; the tests fail while any generated fixture is out of date.
- `npm test` - runs every `test:*` script.
  - `npm run test:unit` - a single Vitest invocation that executes test files, runs their runtime expectations, and type checks them, reporting type errors as test failures.
- `npm run ci` - runs every `ci:*` script: build, ESLint, Prettier and the tests. This is what GitHub Actions runs on every pull request targeting `master` or `develop` and on every push to either, against Node 22 and 24. It also runs on `prepublishOnly`, so `npm publish` refuses to publish a failing build.

To release a new version, follow the checklist and steps in [PUBLISH.md](PUBLISH.md).

# Contributing

For reporting issues, contribution workflow and branching, see [CONTRIBUTE.md](./CONTRIBUTE.md).
