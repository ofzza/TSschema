# Contributing to TSschema

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

## Architecture and glossary

### Project structure

TSschema is two layers, each built in two levels:

|                                                                           | JSON schema base: one unit per JSON schema keyword, internal         | TSSchema level: built on the base, public                                                       |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Type layer** - compile time, infers names and value types from a schema | `src/schema/JSONSchema/` - fragment types, `JSONSchemaFragmentIs*` checks, value type inference | `src/schema/TSSchema*.ts` - wrappers, `TSSchemaName`, `TSSchemaType`                            |
| **Runtime layer** - parses and navigates a schema at runtime              | `src/reflection/JSONSchema/` - facets (parsing a schema)              | `src/reflection/TSSchemaReflection.ts` (with `PropertyPath.ts`, `TypeDescriptor.ts`) - reflections, `reflect`, type descriptors |

- **The JSON schema base** follows JSON schema closely: a file per keyword (`ModelFragment.ts`, `ReferenceFragment.ts`, ...), the same file names in both
  layers. **The TSSchema level** is what users see: it combines the keywords into answers ("what are this model's properties?", "what is this value's
  type?") and is what the main entry (`src/index.ts`) exports.
- **The runtime layer mirrors the type layer name for name**, and is typed by it: `JSONSchema<Kind>Fragment` (type) ↔ `JSONSchema<Kind>FragmentFacet`
  (class), `JSONSchemaFragmentIs<Kind>` ↔ the facet's static `is`, a wrapper ↔ a reflection. Every runtime result's static type is inferred by the
  type layer, so the two must agree on every schema.
- **Code generation** (`src/codegen/`) sits beside both layers: a Node only tool (the `tsschema` command, and the `@ofzza/tsschema/codegen` subpath)
  turning JSON schema files into TypeScript that keeps their literal types, which both layers need.

### Glossary

Terms are listed in the order they build on each other. Use them as defined here, in code, comments and documentation alike.

**JSON schema**

- **Schema** - a whole JSON schema document, as passed to `reflect` or the type utilities.
- **Keyword** - one property of a schema object with a JSON schema meaning (`type`, `properties`, `$ref`, `anyOf`, ...). Annotations (`title`,
  `$comment`, ...) are keywords which constrain nothing.
- **Fragment** - any schema object within a schema, the schema included: a definition, a property's schema, an `anyOf` member, an array's `items`, ...
  The superterm of definition, root fragment and property (see [How the terms relate](#how-the-terms-relate)). *Not* a `$defs` entry specifically:
  that is a definition.
- **Collection** - a schema with `$defs`, i.e. one defining named fragments. *Unspecified collection*: the wide default type `JSONSchemaCollection`,
  standing for "no collection known".
- **Definition** - a named fragment of a collection, i.e. an entry of its `$defs`, addressed as `#/$defs/<definition name>`. Its name is the
  **definition name** (`JSONSchemaDefinitionName`, `TSSchemaDefinitionName`).
- **Root fragment** - a collection with its `$defs` left out (`JSONSchemaCollectionRootFragment`), or a schema with no `$defs` as is: what `reflect` reflects.
- **Model** - a fragment of `type: 'object'` with `properties`. An object fragment without `properties` is *not* a model.
- **Property** - a named entry of a model's `properties`, and the fragment it names. Its name is the **property name**. Whether it is required is up to
  its model's `required` keyword, never the property itself.
- **Path** - a dot-separated list of property names (`'mentor.age'`), addressing a property of a nested model. Only resolved, never enumerated (a
  recursive schema has infinitely many).
- **Type array, branch** - a `type` listing several types (`['object', 'null']`) is split into **branches**, one per group of type names (`object`,
  `array`, `null`, all primitives together), which are alternatives (`JSONSchemaFragmentTypeBranch`). At runtime the branches are held by an
  **implicit `anyOf`** facet.
- **Value type** - the TypeScript type of the values a fragment accepts, as inferred by `JSONSchemaFragmentType` / `TSSchemaType`, and exposed at
  runtime as the type-only `Type` getter (`typeof x.Type`). *Not* the `type` keyword.

**Type layer**

- **Wrapper** - a type holding a fragment together with where it came from, so that its `$ref`s can be resolved later: a **collection wrapper**
  (`__collection`), a **fragment wrapper** (also `__fragment`, `__definitionName`) or a **property wrapper** (also `__property`, `__propertyName`).
  They nest: a property wrapper is a fragment wrapper is a collection wrapper. The type-level counterpart of a reflection.
- **Unwrap** - getting the fragment back out of a wrapper (`UnwrapJSONSchema*Wrapper`); a fragment that is not wrapped unwraps to itself.
- **Unspecified** - the wide default of a type parameter (`JSONSchemaCollection`, `JSONSchemaNotCollectionFragment`), standing for "not known", which
  the utilities treat as such (e.g. `$ref`s against an unspecified collection infer `unknown`).

**Runtime layer**

- **Parsing** - turning a fragment into its facets (`parseJSONSchema`, the router `createJSONSchemaFragmentFacets`). Parsing only splits a fragment up
  by keyword; navigating it is reflection.
- **Facet** - one keyword's parsed view of a fragment: an instance of a `JSONSchema<Kind>FragmentFacet` class. A fragment has as many facets as it has
  keywords matching a facet class, possibly none (e.g. `{ type: 'string', enum: [...] }` has a primitive type facet and an enum facet).
- **Collection facet** - the facet of a collection's `$defs`, holding the facets of every definition by definition name. Every facet and reflection of
  the same schema holds it as its **`collection`**, which `$ref`s are resolved against.
- **Nested fragment** - a fragment owned by another (a property's schema, an `anyOf` member, `items`), parsed with no name.
- **Reflection** - one object per fragment, holding all of its facets plus where it was reached from: a **fragment reflection** (the base class, and the
  root), a **definition reflection** (named by its definition name) or a **property reflection** (named by its property name, with a **parent** - the
  reflection it was looked up from - and whether it is **required**). The runtime counterpart of a wrapper.
- **Type descriptor** - a reflection's `typeDescriptor`: a tree of plain objects, told apart by their **kind** (`model`, `enum`, `reference`, `anyOf`,
  ...), describing a fragment's value type at runtime (`TSSchemaTypeDescriptor`). Built from a fragment's facets (`getTSSchemaTypeDescriptor`,
  `TypeDescriptor.ts`), and inferred from its fragment at type level (`TSSchemaTypeDescriptorOf`). Type shaped where facets are keyword shaped: several
  facets of one fragment are one descriptor (an **implicit** `allOf`, or an `enum` / `const` absorbing the `type` next to it). *Not* a facet, nor the
  value type itself.
- **Nullable** - a descriptor's `nullable` flag: `null` is explicitly accepted where the descriptor is used. `null` next to other types (in an `anyOf`, a
  type array, an `enum`) is extracted into this flag rather than described as an alternative; `null` alone is the `null` kind. Says nothing about a
  reference's `target`.
- **Property descriptor** - an entry of a model descriptor's `properties`: whether the property is `required`, and its `type` descriptor
  (`TSSchemaModelPropertyDescriptor`). *Not* a type descriptor: being required belongs to the property's place in its model, not to its type.
- **Value name** - the name of an `enum` or `const` value where the schema gives none (`getJSONSchemaValueName`): a string is its own name, any other
  value its string form or JSON. Names given by the schema come from `x-enumNames` (an enum) or `title` (each `const` of a `oneOf` described as an enum).
- **Shape** *(internal to property lookup, `PropertyPath.ts`)* - something a property can be looked up in: a model, or an **unknown shape** (an object
  with no `properties`, a `$ref` which can not be resolved, an array with no single schema `items`), in which any property name names a property of
  type `unknown`. Not used in public documentation, which says "an object whose properties are not known".
- **Match** *(internal to property lookup)* - a property found by name in one shape. Several matches are reflected as one property holding an implicit
  `anyOf`.

**Retired terms** - do not reintroduce them:

- **Node** → a *facet* (one keyword's view of a fragment) or a *reflection* (the one object per fragment).
- **Fragment name** (for a `$defs` entry's name) → *definition name*.
- **Context** (for the collection facet held by facets and reflections) → *collection*.
- **Key** (for a property's name) → *property name*.

### How the terms relate

- A **fragment** is the superterm: a definition, the root fragment and a property's schema are all fragments, and so are `anyOf` members and `items`.
- A fragment is parsed into zero or more **facets**, one per keyword; a **reflection** holds all facets of one fragment, and describes its type by one
  **type descriptor** built from them.
- A **definition** and a **property** are fragments with a name, given by their position (`$defs`, `properties`): their reflections are the definition
  and property reflections, and their wrappers the fragment and property wrappers.
- A **wrapper** (type layer) and a **reflection** (runtime layer) play the same role - a fragment plus where it came from - and agree on every name
  and value type.

## Understanding the Internals

Before changing the library, read [Architecture and glossary](#architecture-and-glossary) above, then its showcases. Each is a runnable, type checked test file walking through one layer with commented
examples: `// ^?` queries show the inferred types live in editors with twoslash query support (e.g. VS Code with the `orta.vscode-twoslash-queries`
extension), plain comments state the same types for other editors, and `// Breakpoint:` comments mark where to inspect runtime values with the
"TS: Debug Current Test File" launch configuration.

- [`src/_showcase.test.ts`](src/_showcase.test.ts) - the public API, as documented in the README.
- [`src/schema/_showcase.test.ts`](src/schema/_showcase.test.ts) - the wrapper types behind the public API, and how property paths are resolved.
- [`src/schema/JSONSchema/_showcase.test.ts`](src/schema/JSONSchema/_showcase.test.ts) - the per-keyword JSON schema type utilities everything is built on.
- [`src/reflection/_showcase.test.ts`](src/reflection/_showcase.test.ts) - the runtime reflection module: the reflections, the facets they hold, and the type descriptors built from them.
- [`src/reflection/JSONSchema/_showcase.test.ts`](src/reflection/JSONSchema/_showcase.test.ts) - the runtime JSON schema fragment facets (the parsed form of a schema), mirroring
  the type utilities.

Only `src/_showcase.test.ts` covers public API. The others showcase internal types, classes and helpers, which are never exported from the package.

Beyond the showcases, the tests themselves document every detail: each `describe` opens with a comment explaining what it tests and how,
and any `it` whose reason is not obvious from its title explains why it exists, usually pointing at the gotcha in `AGENTS.md` it guards.
