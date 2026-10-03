#!/usr/bin/env node
/**
 * Executable entry point of the `tsschema` command (see `./cli.ts`).
 */

import { run } from './cli.js';

const { code, close } = run(process.argv.slice(2));
if (!close) {
  process.exitCode = code;
}
