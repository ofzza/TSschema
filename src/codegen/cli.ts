/**
 * Command line interface of the TSschema code generation, run as `tsschema generate [options] <patterns...>` (see `_USAGE`).
 */

import { globSync, watch, type FSWatcher } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { generate, type TSSchemaCodegenMode, type TSSchemaCodegenOptions } from './index.js';

/**
 * Usage instructions printed by `--help`, or after invalid arguments
 */
const _USAGE = `Usage: tsschema generate [options] <patterns...>

Generates TypeScript files from the JSON schema files (*.json) matching the given paths or glob patterns.

Options:
  -m, --mode <mode>         Output mode (default: sidecar):
                              sidecar - <name>.d.json.ts next to <name>.json, typing the JSON module itself
                                        (requires "allowArbitraryExtensions" in tsconfig.json)
                              module  - <name>.schema.ts exporting the schema as an "as const" value
                              types   - <name>.schema.ts exporting only the schema's type
                              (<name>.ts if <name> already is or ends with "schema")
      --models              Also generate a Models map type and a type alias per fragment
                            (into <name>.models.ts in the sidecar mode)
      --out-dir <dir>       Generate module / types mode files into this directory
      --import-from <spec>  Module specifier to import TSschema types from (default: @ofzza/tsschema)
      --check               Only check that generated files are up to date; exits with 1 if any are not
  -w, --watch               Regenerate whenever a JSON file in a watched directory changes
  -h, --help                Prints this message
`;

/**
 * Output of the command line interface
 */
export type TSSchemaCliOutput = {
  /**
   * Prints a line of regular output
   */
  log: (message: string) => void;
  /**
   * Prints a line of error output
   */
  error: (message: string) => void;
};

/**
 * Represents the outcome of running the command line interface: an exit code, and when watching, a function stopping the watch
 */
export type TSSchemaCliResult = {
  /**
   * Exit code: 0 on success, 1 on failure (or stale files when checking), 2 on invalid arguments
   */
  code: number;
  /**
   * Stops watching (only present when watching)
   */
  close?: () => void;
};

/**
 * Finds the JSON files matching paths or glob patterns, skipping anything inside `node_modules`
 *
 * @param patterns Paths or glob patterns
 * @param cwd Directory to resolve the patterns against
 * @returns Sorted, de-duplicated paths of matching JSON files
 */
function _findFiles(patterns: string[], cwd: string): string[] {
  const files = globSync(patterns, { cwd, exclude: (path: string) => /(^|[\\/])node_modules([\\/]|$)/.test(path) });
  return [...new Set(files.filter((file) => file.toLowerCase().endsWith('.json')).map((file) => resolve(cwd, file)))].sort();
}

/**
 * Generates (or checks) the files for every JSON file matching the patterns and reports the outcome
 *
 * @param patterns Paths or glob patterns
 * @param options Code generation options
 * @param cwd Directory to resolve the patterns against
 * @param output Output to report to
 * @returns Exit code
 */
function _generate(patterns: string[], options: TSSchemaCodegenOptions & { check: boolean }, cwd: string, output: TSSchemaCliOutput): number {
  try {
    const sources = _findFiles(patterns, cwd);
    if (!sources.length) {
      output.error(`No JSON files matched: ${patterns.join(' ')}`);
      return 1;
    }
    const { files } = generate(sources, options);
    for (const file of files.filter((file) => file.status !== 'unchanged')) {
      output.log(`${file.status === 'stale' ? 'stale  ' : 'written'} ${relative(cwd, file.path)}`);
    }
    const stale = files.filter((file) => file.status === 'stale').length;
    if (stale) {
      output.error(`${stale} generated file(s) out of date; run the same command without --check to update them`);
      return 1;
    }
    output.log(`${files.filter((file) => file.status === 'written').length} written, ${files.filter((file) => file.status === 'unchanged').length} unchanged`);
    return 0;
  } catch (err) {
    output.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

/**
 * Gets the directories to watch for the patterns: the directory of every matched file, and the part of every pattern before its first glob character
 *
 * @param patterns Paths or glob patterns
 * @param cwd Directory to resolve the patterns against
 * @returns Absolute paths of the directories to watch
 */
function _watchedDirectories(patterns: string[], cwd: string): string[] {
  const bases = patterns.map((pattern) => {
    const glob = pattern.search(/[*?[\]{}]/);
    return resolve(cwd, glob === -1 ? dirname(pattern) : dirname(`${pattern.slice(0, glob)}_`));
  });
  return [...new Set([...bases, ..._findFiles(patterns, cwd).map((file) => dirname(file))])];
}

/**
 * Runs the command line interface
 *
 * @param args Command line arguments, without the executable and script paths
 * @param output Output to report to (defaults to the console)
 * @param cwd Directory to resolve patterns against (defaults to the current working directory)
 * @returns Exit code, and when watching, a function stopping the watch
 */
export function run(args: string[], output: TSSchemaCliOutput = console, cwd: string = process.cwd()): TSSchemaCliResult {
  // Parse arguments
  let parsed: ReturnType<typeof _parse>;
  try {
    parsed = _parse(args);
  } catch (err) {
    output.error(`${err instanceof Error ? err.message : String(err)}\n\n${_USAGE}`);
    return { code: 2 };
  }
  const { values, positionals } = parsed;
  if (values.help) {
    output.log(_USAGE);
    return { code: 0 };
  }
  const [command, ...patterns] = positionals;
  const mode = values.mode ?? 'sidecar';
  const invalid =
    command !== 'generate'
      ? `Unknown command '${command ?? ''}'`
      : !patterns.length
        ? 'No paths or glob patterns given'
        : !['sidecar', 'module', 'types'].includes(mode)
          ? `Unknown mode '${mode}'`
          : values.check && values.watch
            ? 'Options --check and --watch can not be combined'
            : undefined;
  if (invalid) {
    output.error(`${invalid}\n\n${_USAGE}`);
    return { code: 2 };
  }

  // Generate
  const options = {
    mode: mode as TSSchemaCodegenMode,
    models: values.models,
    outDir: values['out-dir'] === undefined ? undefined : resolve(cwd, values['out-dir']),
    importFrom: values['import-from'],
    check: values.check ?? false,
  };
  const code = _generate(patterns, options, cwd, output);
  if (!values.watch) {
    return { code };
  }

  // Watch: regenerate (debounced) whenever a JSON file changes in any of the watched directories
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const watchers: FSWatcher[] = _watchedDirectories(patterns, cwd).map((directory) =>
    watch(directory, (_event, filename) => {
      if (filename?.toString().toLowerCase().endsWith('.json')) {
        clearTimeout(timeout);
        timeout = setTimeout(() => _generate(patterns, options, cwd, output), 100);
      }
    }),
  );
  output.log(`Watching ${watchers.length} director${watchers.length === 1 ? 'y' : 'ies'} for changes ...`);
  return {
    code,
    close: () => {
      clearTimeout(timeout);
      watchers.forEach((watcher) => watcher.close());
    },
  };
}

/**
 * Parses command line arguments
 *
 * @param args Command line arguments
 * @returns Parsed options and positional arguments
 */
function _parse(args: string[]) {
  return parseArgs({
    args,
    allowPositionals: true,
    options: {
      mode: { type: 'string', short: 'm' },
      models: { type: 'boolean' },
      'out-dir': { type: 'string' },
      'import-from': { type: 'string' },
      check: { type: 'boolean' },
      watch: { type: 'boolean', short: 'w' },
      help: { type: 'boolean', short: 'h' },
    },
  });
}
