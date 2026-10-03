import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run, type TSSchemaCliOutput } from './cli.js';

/**
 * Creates an output collecting everything printed to it
 *
 * @returns Output, and the lines printed to it
 */
function _output(): TSSchemaCliOutput & { logged: string[]; errors: string[] } {
  const logged: string[] = [];
  const errors: string[] = [];
  return { logged, errors, log: (message) => logged.push(message), error: (message) => errors.push(message) };
}

/**
 * Runs a callback with a fresh temporary directory containing `schemas/a.json`, `schemas/b.json` and `node_modules/c.json`, removed afterwards
 *
 * @param callback Callback to run
 */
function _withSchemas(callback: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tsschema-cli-'));
  try {
    mkdirSync(join(dir, 'schemas'));
    mkdirSync(join(dir, 'node_modules'));
    for (const path of ['schemas/a.json', 'schemas/b.json', 'node_modules/c.json']) {
      writeFileSync(join(dir, path), '{ "$defs": { "A": { "type": "string" } } }');
    }
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('cli', () => {
  describe('run', () => {
    it('Generates files for every JSON file matching the patterns, outside of node_modules', () => {
      _withSchemas((dir) => {
        const output = _output();
        expect(run(['generate', '**/*.json'], output, dir).code).toBe(0);
        expect(existsSync(join(dir, 'schemas', 'a.d.json.ts'))).toBe(true);
        expect(existsSync(join(dir, 'schemas', 'b.d.json.ts'))).toBe(true);
        expect(existsSync(join(dir, 'node_modules', 'c.d.json.ts'))).toBe(false);
        expect(output.logged).toEqual([`written ${join('schemas', 'a.d.json.ts')}`, `written ${join('schemas', 'b.d.json.ts')}`, '2 written, 0 unchanged']);
      });
    });

    it('Passes the mode, model, output directory and import options on', () => {
      _withSchemas((dir) => {
        const args = ['generate', '-m', 'types', '--models', '--out-dir', 'out', '--import-from', 'x', 'schemas/a.json'];
        expect(run(args, _output(), dir).code).toBe(0);
        expect(existsSync(join(dir, 'out', 'a.schema.ts'))).toBe(true);
      });
    });

    it('Exits with 1 when checking finds stale files, and with 0 once they are up to date', () => {
      _withSchemas((dir) => {
        const output = _output();
        expect(run(['generate', '--check', 'schemas/*.json'], output, dir).code).toBe(1);
        expect(output.errors).toEqual(['2 generated file(s) out of date; run the same command without --check to update them']);
        expect(existsSync(join(dir, 'schemas', 'a.d.json.ts'))).toBe(false);
        run(['generate', 'schemas/*.json'], _output(), dir);
        expect(run(['generate', '--check', 'schemas/*.json'], _output(), dir).code).toBe(0);
      });
    });

    it('Exits with 1 when nothing matches, or a schema can not be generated', () => {
      _withSchemas((dir) => {
        expect(run(['generate', 'missing/*.json'], _output(), dir).code).toBe(1);
        writeFileSync(join(dir, 'schemas', 'a.json'), 'true');
        const output = _output();
        expect(run(['generate', 'schemas/a.json'], output, dir).code).toBe(1);
        expect(output.errors[0]).toMatch(/requires a JSON object/);
      });
    });

    it('Exits with 2 and prints usage on invalid arguments', () => {
      for (const args of [
        [],
        ['build', 'a.json'],
        ['generate'],
        ['generate', '--mode', 'x', 'a.json'],
        ['generate', '--check', '--watch', 'a.json'],
        ['--nope'],
      ]) {
        const output = _output();
        expect(run(args, output).code).toBe(2);
        expect(output.errors[0]).toContain('Usage: tsschema generate');
      }
    });

    it('Prints usage on --help', () => {
      const output = _output();
      expect(run(['--help'], output).code).toBe(0);
      expect(output.logged[0]).toContain('Usage: tsschema generate');
    });

    it('Regenerates when a watched JSON file changes, until closed', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'tsschema-cli-'));
      try {
        writeFileSync(join(dir, 'a.json'), '{ "$defs": {} }');
        const output = _output();
        const { code, close } = run(['generate', '--watch', '*.json'], output, dir);
        expect(code).toBe(0);
        expect(close).toBeTypeOf('function');
        writeFileSync(join(dir, 'a.json'), '{ "$defs": { "A": {} } }');
        await expect.poll(() => output.logged.filter((line) => line.startsWith('written')).length, { timeout: 5000 }).toBe(2);
        close!();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
