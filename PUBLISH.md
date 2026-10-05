# Publishing `@ofzza/tsschema`

How to release a new version to NPM. Releases follow the branching model in `AGENTS.md`: work lands on `develop`, a release merges `develop` into
`master`, and NPM is published from `master`.

## Pre-publish checklist

Go through every item before each publish.

### Repository state

- [ ] `develop` is clean (`git status`) and up to date with `origin/develop`.
- [ ] `npm run ci` passes locally (build, ESLint, Prettier, unit tests and type checks).
- [ ] GitHub Actions CI is green on `develop` for both Node 22 and Node 24.
- [ ] Generated fixtures are fresh: `npm run fixtures` leaves `git status` clean. (`src/codegen/index.test.ts` catches stale fixtures too.)

### Package metadata (`package.json`)

- [ ] `version` is the version being released and has never been published (`npm view @ofzza/tsschema versions`). Below `1.0.0`, bump the minor version
      for breaking changes and the patch version for everything else.
- [ ] `description` and `keywords` only claim what this version actually does. For example, do not list runtime reflection while the README Roadmap still
      says it is planned.
- [ ] `dependencies` only lists packages that published `.d.ts` / `.js` files import (currently just `@types/json-schema`). To check, build declarations
      and grep `dist/` for non-relative imports:
      ```sh
      npm run build && grep -rhn "from '" dist --include=*.d.ts | grep -v "from '\.\{1,2\}/"
      ```
      The only match should be `json-schema`.
- [ ] Every entry in `exports` and `bin` points at a file that exists in `dist/` after `npm run build`.

### Package contents

- [ ] `npm pack --dry-run` lists only `dist/**`, `README.md`, `LICENSE` and `package.json`, with no tests, `res/` fixtures, `_legacy.gitignore/` or
      stale modules from earlier builds.
- [ ] `dist/codegen/bin.js` starts with `#!/usr/bin/env node`.

### Documentation

- [ ] `README.md` `# Usage` matches the current exports and behaviour, and its samples have been verified against `tsc` (see
      [Verifying README samples](AGENTS.md#verifying-readme-samples)).
- [ ] The README `# Roadmap` matches what this version ships.
- [ ] `AGENTS.md` [Exports](AGENTS.md#exports) matches `src/index.ts` and `src/codegen/index.ts`.
- [ ] Release notes are written for this version: what changed, and any breaking change to `TSSchemaFragment`, `TSSchemaType`, `TSSchemaJSONSchema`
      or `TSSchemaJSONCollection`, which every consumer's generated code imports.

### Consumer smoke test

- [ ] The packed tarball works when installed into a new project. From an empty scratch directory:
      ```sh
      npm pack --pack-destination . <path-to-repo>
      npm init -y && npm pkg set type=module
      npm install ./ofzza-tsschema-<version>.tgz typescript@5
      ```
      Then confirm that:
  - [ ] `npx tsschema generate --models schema.json` generates `schema.d.json.ts` and `schema.models.ts`.
  - [ ] `npx tsschema generate --check --models schema.json` reports the files as unchanged and exits with `0`.
  - [ ] A file importing types from `@ofzza/tsschema`, the generated models and `generateFiles` from `@ofzza/tsschema/codegen` compiles under
        `tsc --noEmit --strict --allowArbitraryExtensions --resolveJsonModule`, both with `--module nodenext` and with
        `--module esnext --moduleResolution bundler`.
  - [ ] An invalid value (e.g. a wrong enum member) fails to compile.

### NPM access

- [ ] `npm whoami` prints your account. If it doesn't, run `npm login`.
- [ ] You have the 2FA one-time password ready if the account requires it.

## Packaging and publishing steps

1. **Bump the version on `develop`.** This updates `package.json` and `package-lock.json`, commits, and creates the `v<version>` tag:
   ```sh
   git checkout develop && git pull
   npm version <version>            # e.g. 0.1.0, or patch / minor / major
   git push origin develop --follow-tags
   ```
2. **Merge `develop` into `master`.** Open a pull request from `develop` to `master`, wait for CI to pass on it, and merge. `master` never receives
   direct commits.
3. **Check out the released `master`:**
   ```sh
   git checkout master && git pull
   git status                       # must be clean
   ```
4. **Do a dry run:**
   ```sh
   npm publish --dry-run
   ```
   This runs `prepare` (a clean build) and `prepublishOnly` (`npm run ci`), and prints the tarball contents without uploading. Check the file list,
   `name` and `version`.
5. **Publish:**
   ```sh
   npm publish                      # add --otp=<code> if 2FA asks for it
   ```
   `publishConfig.access: public` is already set, so the scoped package is published publicly without `--access public`.
6. **Verify the release:**
   ```sh
   npm view @ofzza/tsschema version dist-tags
   ```
   Then re-run the [consumer smoke test](#consumer-smoke-test) with `npm install @ofzza/tsschema@<version>` in place of the tarball.
7. **Create the GitHub release** for the `v<version>` tag, using the release notes from the checklist.
8. **Continue on `develop`:**
   ```sh
   git checkout develop
   ```

If a published version turns out broken, do not unpublish it. Publish a fixed patch version, and deprecate the broken one:

```sh
npm deprecate @ofzza/tsschema@<version> "<reason>, use <fixed-version>"
```
