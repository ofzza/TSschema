# TSschema

Helps generate TS data models, provides TS utility types for deep type inference and provides TS runtime utilities for type reflection, all based off of a JSON schema.

---

Jump to section:

- [Get TSschema](#get-tsschema)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)

# Get TSschema

To start using `TSschema` in your project, simply install it from NPM by running the following in your terminal:

```sh
$ npm install @ofzza/tsschema --save
```

# Usage

The library is currently being built and does not yet export a stable API. Its planned scope, all driven by a single JSON schema describing your data models:

- **Model generation** - generating TypeScript data model definitions from the JSON schema.
- **Deep type inference** - utility types inferring model names, property names, property paths and their types directly from the schema, at compile time.
- **Runtime reflection** - runtime utilities for inspecting the same model, property and path information the utility types infer.

This section will document each export as it is added.

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
