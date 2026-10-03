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
schema declared `as const`, so that its literal types are kept.

A few terms used below:

- A **collection** is a schema defining its **fragments** (models, enums, ...) in `$defs`. Fragments reference one another as `{ $ref: '#/$defs/<name>' }`.
- A **model** is an object fragment with `properties`.
- A **wrapper** holds on to a fragment (or a property) together with its context: the collection it came from, its name and, for a property, its parent
  model. This lets any `$ref` it contains be resolved later.

The examples below all use this schema:

```ts
import type { TSSchemaCollection, TSSchemaFragment, TSSchemaProperty, TSSchemaName, TSSchemaType } from '@ofzza/tsschema';

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

# Roadmap

`TSschema` is being built towards the following scope, all driven by a single JSON schema describing your data models:

- **Deep type inference** - utility types inferring model names, property names, property paths and their types directly from the schema, at compile
  time. Partly available, see [Usage](#usage). Property paths are not yet supported.
- **Model generation** - generating TypeScript data model definitions from the JSON schema. Planned.
- **Runtime reflection** - runtime utilities for inspecting the same model, property and path information the utility types infer. Planned.

# Development

- `npm run build` - cleans `dist/` (`npm run clean`), then compiles `src/` into it, emitting declarations. Also run on `prepare`, so a local `npm install` builds too.
- `npm run dev` - the same, in watch mode.
- `npm test` - runs every `test:*` script.
  - `npm run test:unit` - a single Vitest invocation that executes test files, runs their runtime expectations, and type checks them, reporting type errors as test failures.
- `npm run ci` - runs every `ci:*` script: build, ESLint, Prettier and the tests. This is what GitHub Actions runs on every pull request targeting `master` or `develop` and on every push to either, against Node 22 and 24. It also runs on `prepublishOnly`, so `npm publish` refuses to publish a failing build.

# Contributing

## Reporting Issues

When reporting issues, please keep to provided templates.

Before reporting issues, please read: [GitHub Work-Flow](https://github.com/ofzza/onboarding/blob/master/CONTRIBUTING/github.md)

## Contributing Code

For work-flow and general etiquette when contributing, please see:

- [Git Source-Control Work-Flow](https://github.com/ofzza/onboarding/blob/master/CONTRIBUTING/git.md)
- [GitHub Work-Flow](https://github.com/ofzza/onboarding/blob/master/CONTRIBUTING/github.md)

This repository uses two long-lived branches:

- `develop` - the work-in-progress trunk. **Create all feature branches from `develop`, and target all pull requests at `develop`.**
- `master` - always contains the latest stable released version. It only ever gets merged into from `develop`, when a stable version is released.

Please accompany any work, fix or feature with their own issue, in it's own branch (see [Git Source-Control Work-Flow](https://github.com/ofzza/onboarding/blob/master/CONTRIBUTING/git.md) for branch naming conventions), and once done, request merge via pull request.

When creating issues and PRs, please keep to provided templates.
