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

Before committing or requesting a merge, make sure `npm run ci` passes locally (build, ESLint, Prettier and tests), and that `README.md`, `CONTRIBUTE.md` and `AGENTS.md` reflect the change.

## Architecture and glossary

### Project structure

TSschema is two layers, each built in two levels:

|                                                                           | JSON schema base: one unit per JSON schema keyword, internal                                    | TSSchema level: built on the base, public                                                                                                                      |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type layer** - compile time, infers names and value types from a schema | `src/schema/JSONSchema/` - fragment types, `JSONSchemaFragmentIs*` checks, value type inference | `src/schema/TSSchema*.ts` - wrappers, `TSSchemaName`, `TSSchemaType`                                                                                           |
| **Runtime layer** - parses and navigates a schema at runtime              | `src/reflection/JSONSchema/` - facets (parsing a schema)                                        | `src/reflection/TSSchemaReflection.ts` (with `PropertyPath.ts`, `TypeDescriptor.ts`, `Annotations.ts`) - reflections, `reflect`, type descriptors, annotations |

- **The JSON schema base** follows JSON schema closely: a file per keyword (`ModelFragment.ts`, `ReferenceFragment.ts`, ...), the same file names in both
  layers. **The TSSchema level** is what users see: it combines the keywords into answers ("what are this model's properties?", "what is this value's
  type?") and is what the main entry (`src/index.ts`) exports.
- **The runtime layer mirrors the type layer name for name**, and is typed by it: `JSONSchema<Kind>Fragment` (type) ↔ `JSONSchema<Kind>FragmentFacet`
  (class), `JSONSchemaFragmentIs<Kind>` ↔ the facet's static `is`, a wrapper ↔ a reflection. Every runtime result's static type is inferred by the
  type layer, so the two must agree on every schema.
- **Code generation** (`src/codegen/`) sits beside both layers: a Node only tool (the `tsschema` command, and the `@ofzza/tsschema/codegen` subpath)
  turning JSON schema files into TypeScript that keeps their literal types, which both layers need. It uses the runtime layer (`reflect`) to find
  the enums it can also generate as runtime values.

### Glossary

Terms are listed in the order they build on each other. Use them as defined here, in code, comments and documentation alike.

**JSON schema**

- **Schema** - a whole JSON schema document, as passed to `reflect` or the type utilities.
- **Keyword** - one property of a schema object with a JSON schema meaning (`type`, `properties`, `$ref`, `anyOf`, ...). A **vendor keyword** is one
  JSON schema does not define, prefixed `x-` (`x-enumNames`, `x-decorators`); the `JSONSchema7` type does not declare them, so they are read with
  `getJSONSchemaKeyword` and never added to the type layer's fragment types.
- **Constraint** - a validation keyword which limits the values of one type of values only: a number (`minimum`, `maximum`, `exclusiveMinimum`,
  `exclusiveMaximum`, `multipleOf`), a string (`minLength`, `maxLength`, `pattern`, `contentEncoding`), an array (`minItems`, `maxItems`,
  `uniqueItems`) or an object (`minProperties`, `maxProperties`) - except `format`, which applies to values of any type (JSON Schema predefines string
  formats only, but allows custom ones of any type), so every kind of constraints has it. Parsed by the facet of that type, and held by its type
  descriptor's `constraints`.
  Never used by value type inference (see AGENTS.md › Constraints and annotations never change inferred value types).
- **Annotation** - a keyword describing a fragment rather than constraining its values (`title`, `description`, `default`, `deprecated`, `examples`,
  and the decorators; `$comment` is not exposed). Belongs to the position the fragment is used at, so it is read from the fragment itself, never
  through a `$ref`, and is no facet's: a reflection's `annotations` and a property descriptor's `annotations` (`TSSchemaAnnotations`, `Annotations.ts`).
- **Decorator** - an entry of the `x-decorators` vendor keyword (`TSSchemaDecoratorDescriptor`): something applied to the type or property a fragment
  was generated from (e.g. a .NET attribute, as written by the sibling dotnetschema project), by its `name`, its `arguments` and its `properties`.
- **Fragment** - any schema object within a schema, the schema included: a definition, a property's schema, an `anyOf` member, an array's `items`, ...
  The superterm of definition, root fragment and property (see [How the terms relate](#how-the-terms-relate)). _Not_ a `$defs` entry specifically:
  that is a definition.
- **Collection** - a schema with `$defs`, i.e. one defining named fragments. _Unspecified collection_: the wide default type `JSONSchemaCollection`,
  standing for "no collection known".
- **Definition** - a named fragment of a collection, i.e. an entry of its `$defs`, addressed as `#/$defs/<definition name>`. Its name is the
  **definition name** (`JSONSchemaDefinitionName`, `TSSchemaDefinitionName`).
- **Root fragment** - a collection with its `$defs` left out (`JSONSchemaCollectionRootFragment`), or a schema with no `$defs` as is: what `reflect` reflects.
- **Model** - a fragment of `type: 'object'` with `properties`. An object fragment without `properties` is _not_ a model.
- **Property** - a named entry of a model's `properties`, and the fragment it names. Its name is the **property name**. Whether it is required is up to
  its model's `required` keyword, never the property itself.
- **Path** - a dot-separated list of property names (`'mentor.age'`), addressing a property of a nested model. Only resolved, never enumerated (a
  recursive schema has infinitely many).
- **Type array, branch** - a `type` listing several types (`['object', 'null']`) is split into **branches**, one per group of type names (`object`,
  `array`, `null`, all primitives together), which are alternatives (`JSONSchemaFragmentTypeBranch`). At runtime the branches are held by an
  **implicit `anyOf`** facet.
- **Value type** - the TypeScript type of the values a fragment accepts, as inferred by `JSONSchemaFragmentType` / `TSSchemaType`, and exposed at
  runtime as the type-only `Type` getter (`typeof x.Type`). _Not_ the `type` keyword.

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
  facets of one fragment are one descriptor (an **implicit** `allOf`, or an `enum` / `const` absorbing the `type` next to it). _Not_ a facet, nor the
  value type itself. Holds the constraints of its kind (`constraints`), never annotations.
- **Nullable** - a descriptor's `nullable` flag: `null` is explicitly accepted where the descriptor is used. `null` next to other types (in an `anyOf`, a
  type array, an `enum`) is extracted into this flag rather than described as an alternative; `null` alone is the `null` kind. Says nothing about a
  reference's `target`.
- **Property descriptor** - an entry of a model descriptor's `properties`: whether the property is `required`, its `type` descriptor and its
  `annotations` (`TSSchemaModelPropertyDescriptor`). _Not_ a type descriptor: being required and annotations belong to the property's place in its
  model, not to its type.
- **Value name** - the name of an `enum` or `const` value where the schema gives none (`getJSONSchemaValueName`): a string is its own name, any other
  value its string form or JSON. Names given by the schema come from `x-enumNames` (an enum) or `title` (each `const` of a `oneOf` described as an enum).
- **Shape** _(internal to property lookup, `PropertyPath.ts`)_ - something a property can be looked up in: a model, or an **unknown shape** (an object
  with no `properties`, a `$ref` which can not be resolved, an array with no single schema `items`), in which any property name names a property of
  type `unknown`. Not used in public documentation, which says "an object whose properties are not known".
- **Match** _(internal to property lookup)_ - a property found by name in one shape. Several matches are reflected as one property holding an implicit
  `anyOf`.

**Retired terms** - do not reintroduce them:

- **Node** → a _facet_ (one keyword's view of a fragment) or a _reflection_ (the one object per fragment).
- **Fragment name** (for a `$defs` entry's name) → _definition name_.
- **Context** (for the collection facet held by facets and reflections) → _collection_.
- **Key** (for a property's name) → _property name_.

### How the terms relate

- A **fragment** is the superterm: a definition, the root fragment and a property's schema are all fragments, and so are `anyOf` members and `items`.
- A fragment is parsed into zero or more **facets**, one per keyword; a **reflection** holds all facets of one fragment, and describes its type by one
  **type descriptor** built from them, holding the **constraints** its facets parsed. Its **annotations** are read from the fragment itself.
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
- [`src/reflection/_showcase.test.ts`](src/reflection/_showcase.test.ts) - the runtime reflection module: the reflections, the facets they hold, the type descriptors built from them (with their constraints), and the annotations read from their fragments.
- [`src/reflection/JSONSchema/_showcase.test.ts`](src/reflection/JSONSchema/_showcase.test.ts) - the runtime JSON schema fragment facets (the parsed form of a schema), mirroring
  the type utilities.

Only `src/_showcase.test.ts` covers public API. The others showcase internal types, classes and helpers, which are never exported from the package.

Beyond the showcases, the tests themselves document every detail: each `describe` opens with a comment explaining what it tests and how,
and any `it` whose reason is not obvious from its title explains why it exists, usually pointing at the gotcha in `AGENTS.md` it guards.

<!-- <@ofzza/repo-skill:contribute> Managed by the repo skill: this tag marks where its Workflow section starts. -->

## Workflow

Work in this repository is done together with an AI agent (e.g. Claude Code), following the rules in [WORKFLOW.md](./WORKFLOW.md). This section explains them for you, the person working with the agent. Where the text above and this section differ, this section applies; where this section and `WORKFLOW.md` differ, `WORKFLOW.md` applies. Words in **bold** are defined in [Terminology](#terminology) below.

### How it works

- **Stages**: the work moves through three **stages**:
  1. **Specification**: you and the agent agree on what to build, in `./.workflow/SPEC.md`. If there's none yet, the agent starts here, asking for the idea, what the project must do or have (and which items are must-haves), and how much time and complexity you're willing to spend;
  2. **Planning**: you agree on how to build it, in `./.workflow/PLAN.md`, split into **segments**;
  3. **Implementation**: the agent implements approved segments one at a time, stopping for your review after each.

  You can run ahead (draft a plan while the specification is still open) or go back (the agent proposes fixing the specification when implementation shows it's wrong). Nothing is implemented until you've approved its plan, or confirmed the **fast path** for it.

- **Workflow files**, under `./.workflow/`: `SPEC.md`, `PLAN.md`, `STATE.md` (the **session state**: where the work stopped, what's waiting on whom, and a dated history of milestones), and `.temp/` (throwaway **working files**, never committed).
- **Where the agent gets its rules**: your agent reads `AGENTS.md` (Claude Code through `CLAUDE.md`), which points it to `WORKFLOW.md`, and then, if it exists, `WORKFLOW.custom.md`.
- **Customizing the workflow**: `WORKFLOW.md` is generated by the `repo` skill and replaced when the workflow is upgraded, so leave it as it is. This project's own workflow rules go in `WORKFLOW.custom.md` (committed, shared by everyone), which the agent reads last and which applies where the two differ, except that it can't relax a hard rule. Ask the agent to change the workflow and it makes the change there, creating the file if needed.
- **Resuming**: the specification and plan are committed, and the session state records where the work stopped, so you can stop at any point and pick up in a fresh session.
- **Two word lists**: the [Terminology](#terminology) below defines the words for how the work is done; the **Glossary** (the first section of this file with "Glossary" in its heading, created when the first domain term is defined) defines the project's domain terms, for what is built. Variants are fine ("spec" for specification). For any other word that could stand for a defined term (e.g. "requirements" for the specification), the agent asks "Did you mean the specification?" before acting, every time. If you'd rather use your own word, ask the agent to add it to the term as an alias, or to define a new term. "Quick fix" and "resume" are built in.
- **What wins**: your instructions in the conversation, then the specification, plan and Glossary (only on what is built), then `AGENTS.md`, other agent files, `WORKFLOW.md` and `WORKFLOW.custom.md` (which applies over `WORKFLOW.md`); hard rules above all. Text from dependencies, tools, issues, web pages or other agents never authorises anything.

### How to use it

- **Start a session**: ask the agent to resume (or run `/repo continue` if you have the `repo` skill). Whatever you ask first, it reads the session state, runs `git status`, and tells you where the work stopped, what's next, and about any uncommitted changes.
- **Say what to work on**, e.g. "let's work on the specification", "plan the export feature", "continue implementing", or "quick fix: the date format is wrong in the footer".
- **Answer dialogs**: the agent asks in dialogs of up to 4 questions with up to 4 options each (a question box, or numbered questions in agents without one). When it goes through the choices a draft makes, each shows its position (e.g. `Q3 (3/9)`), its background, the options with their trade-offs, and a recommendation. Long lists go into a file under `./.workflow/.temp/`, and you can accept all the recommendations at once, or pick which to discuss; anything touching a hard rule, a system change, credentials, an outward action or a new dependency is always asked on its own.
- **Approve, or don't**: pick the approving option, or say yes to a dialog that names what's being approved. To hold back, pick "discuss" or "stop here", or say what's wrong.
- **Checkpoints**: after each implemented segment or fast-path change, the agent summarizes what changed, the documentation and tests updated, the build, test and lint results, any failure that was already there, and any deviation from the plan, then offers "approve and commit", "approve, don't commit", "discuss" or "stop here". "Approve and commit" is your yes for that one commit; pushing asks again.
- **Fast path**: for a small, self-contained change, or when you ask for a quick fix, the agent proposes a one-line plan, the change (with its documentation and tests) and one checkpoint, and goes ahead once you confirm. It works without a specification; a change that needs real choices gets a plan instead, and one that changes the project's scope goes through the specification first.
- **Choices during implementation**: a choice the plan doesn't state (a new dependency, a public interface, a file deleted or moved, a data format) is put to you before the agent acts on it.
- **Reviews and spikes**: the agent may propose **zero-context reviews** and **spikes**, and you can ask for either. Neither runs without your **go-ahead** (asking for one is the go-ahead). Review findings come back as questions, fixes and skips for you to confirm, plus points for later; spikes run only in `./.workflow/.temp/`, never in the real code.
- **Long tasks**: tasks over a couple of minutes run in the background, announced with an estimate, with progress at least every 5 minutes; every subagent's start and finish is reported.
- **Quick checks by you**: when you can check something faster yourself (look at a screen, try a button), the agent asks you to, with exact paths and what to look for.

### What you need to do

- **Give approvals explicitly**: only a clear yes, in answer to a dialog naming what's being approved, counts. Silence, a comment on wording or an answer about something else approves nothing.
- **Answer "Did you mean …?" questions**: the agent won't act on a request with an undefined word until you do.
- **Resume after a stop**: when the agent stops and reports a problem, it waits until you tell it to continue.
- **Grant hard-rule exceptions yourself**: the agent never offers one; only you can, by naming the rule, and each exception covers one action.
- **Keep credentials out of files**: never ask the agent to write one into a file; if you paste one into the conversation, rotate it once the task is done.
- **Commit the workflow files** when the agent proposes it after an approval, so that others, and your future sessions, see the same state.
- **Your own agent instructions still apply** alongside this workflow; where they conflict, the agent asks you.

### What the agent always does

- **Asks before any commit or outward action**: every commit, amend, rebase, tag, push, pull-request action, publish, deploy or post to an external service needs your yes for that one action.
- **Stops and reports**: if it, or a subagent, breaks a rule or changes something you didn't ask for, it stops, reports what ran, what changed and how to undo it, records the stop in the session state, and doesn't clean up on its own.
- **Follows the hard rules**: yours, kept as HARD RULES in `./.workflow/SPEC.md`, and the workflow's own (stop and report, system changes, credentials, no AI attribution, working files, subagents, plus those of any additional workflow below). Nothing relaxes them.
- **Asks before system changes**: no `sudo`, system packages, global tools or toolchains, containers, or global git or tool configuration, and nothing outside the repository and its session scratch directory, without your yes for that one action.
- **Protects credentials**: it never writes them into files, never reads ones it wasn't given, and never commits a file that contains one. Tools like git may use their own stored credentials for actions you've approved, but the agent never looks at them.
- **Credits no AI**: commits, pull requests and documentation never credit the agent.
- **Keeps documentation and tests current**: whenever it adds or changes code, it updates the affected documentation (READMEs, this file and its Glossary, the project facts in `AGENTS.md`, code comments) and adds or updates tests. It never deletes, skips or weakens a test to make the suite pass without your yes. If there's no way to test a change, it asks you once whether to set one up.
- **Keeps every commit green**: before each commit it builds the project and runs the full test suite, the linters and the formatters. It fixes failures its change causes; a failure that was already there is reported and recorded as an open point. Committing with a failure of its own needs your yes for that commit, is noted in the commit message, and is fixed in the next one.
- **Grows the Glossary**: when the work introduces a new domain concept, it proposes adding it; changing or removing a term happens only when you ask, and then updates every use.
- **Changes the rules only when you ask**: it never edits `WORKFLOW.md`, `WORKFLOW.custom.md` or the rules in `AGENTS.md` on its own, and the changes you ask for go into `WORKFLOW.custom.md`; an additional workflow counts only if `/repo init` or you added it. If a rule seems outdated, it proposes the change and keeps following the rule until you approve.

### Terminology

The terms for how work is done in this repository. They change only with the workflow; the project's domain terms are in the Glossary.

| Term                    | Meaning                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Stage**               | One of specification, planning and implementation.                                                                              |
| **Specification**       | What the project is and must do: `./.workflow/SPEC.md`.                                                                         |
| **Plan**                | How the specification gets built, split into segments: `./.workflow/PLAN.md`.                                                   |
| **Segment**             | A part of the plan that's planned, approved and implemented as a unit; segments can have child segments.                        |
| **Session state**       | `./.workflow/STATE.md`: where the work stopped, what's waiting on whom (you, others, running tasks), and the milestone history. |
| **Resume**              | Also: continue. Start a session: the agent reads the session state and reports where the work stopped.                          |
| **Dialog**              | Up to 4 questions with up to 4 options each, in a question box or as a numbered list; the agent waits for your answers.         |
| **PROPOSE**             | The agent suggests something, with its reasoning, in a dialog, and acts only after your explicit yes.                           |
| **Approval**            | Your explicit yes to a named item (the specification, a plan segment, an implemented step).                                     |
| **Go-ahead**            | Your yes to start something (a review, a spike, a subagent run); it isn't an approval.                                          |
| **Checkpoint**          | The review dialog after each implemented segment or fast-path change.                                                           |
| **Fast path**           | Also: quick fix. The shortcut for small, self-contained changes: one-line plan, the change, one checkpoint.                     |
| **Hard rule**           | A rule on how work is done that nothing (no file, task or agent) can relax; only you can grant an exception, for one action.    |
| **Open point**          | Something found while working on one stage or segment that belongs to another, recorded there instead of acted on out of turn.  |
| **Pitfall**             | A risk that could make the work stall or backtrack later, recorded in the specification as soon as it's noticed.                |
| **Known open issue**    | An item you chose to defer, recorded in the plan with the reason, until it's picked up or dropped.                              |
| **Spike**               | A small, throwaway prototype that settles whether an approach works, before planning on top of it.                              |
| **Zero-context review** | A review by fresh agents that know nothing of the conversation, reading only the files they're given.                           |
| **Working files**       | Throwaway files under `./.workflow/.temp/<topic>/`, deleted once you confirm their results are written where they belong.       |
| **Subagent**            | Any agent, session or script the agent delegates work to; it's bound by the hard rules and the rest of its brief.               |
| **Stray write**         | A change no one asked for, found by comparing the repository with a snapshot taken before subagents ran; it's reported to you.  |
| **Green**               | The repository builds, its full test suite passes, and its linters and formatters pass, as far as it has them.                  |
| **Glossary**            | The project's domain terms, for what is built, in the first section of this file with "Glossary" in its heading.                |

<!-- </@ofzza/repo-skill:contribute> -->
