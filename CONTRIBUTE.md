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

## Understanding the Internals

Before changing the library, it helps to read through its showcases. Each is a runnable, type checked test file walking through one layer with commented
examples: `// ^?` queries show the inferred types live in editors with twoslash query support (e.g. VS Code with the `orta.vscode-twoslash-queries`
extension), plain comments state the same types for other editors, and `// Breakpoint:` comments mark where to inspect runtime values with the
"TS: Debug Current Test File" launch configuration.

- [`src/showcase.test.ts`](src/showcase.test.ts) - the public API, as documented in the README.
- [`src/schema/showcase.test.ts`](src/schema/showcase.test.ts) - the wrapper types behind the public API, and how property paths are resolved.
- [`src/schema/JSONSchema/showcase.test.ts`](src/schema/JSONSchema/showcase.test.ts) - the per-keyword JSON schema type utilities everything is built on.
- [`src/reflection/showcase.test.ts`](src/reflection/showcase.test.ts) - the (internal, work in progress) runtime reflection module.
- [`src/reflection/JSONSchema/showcase.test.ts`](src/reflection/JSONSchema/showcase.test.ts) - the runtime JSON schema fragment reflections, mirroring
  the type utilities.

Only `src/showcase.test.ts` covers public API. The others showcase internal types, classes and helpers, which are never exported from the package.
