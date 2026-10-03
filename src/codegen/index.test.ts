import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { generate, generateFiles, type TSSchemaCodegenOptions } from './index.js';

import type { default as schoolJson } from '../../res/school.json';
import type { default as schoolModule } from '../../res/module/school.schema.js';
import type { Schema as SchoolTypes } from '../../res/types/school.schema.js';
import type { Models as SchoolSidecarModels } from '../../res/school.models.js';
import type { Models as SchoolModuleModels } from '../../res/module/school.schema.js';
import type { Models as SchoolTypesModels } from '../../res/types/school.schema.js';
import type { default as edgeJson } from '../../res/edge.json';
import type { default as edgeModule } from '../../res/module/edge.schema.js';
import type { Schema as EdgeTypes } from '../../res/types/edge.schema.js';
import type { Models as EdgeSidecarModels, Plain as EdgeSidecarPlain } from '../../res/edge.models.js';
import type { Models as EdgeModuleModels } from '../../res/module/edge.schema.js';
import type { Models as EdgeTypesModels } from '../../res/types/edge.schema.js';

/**
 * Makes the top-level properties of a type read-only. The type of a JSON module is its module namespace, whose members are not marked read-only, while
 * everything below them is
 */
type _ReadOnlyTopLevel<T> = { readonly [K in keyof T]: T[K] };

/**
 * Code generation options the committed `res/` fixtures were generated with (see the `fixtures` npm script)
 */
const _FIXTURE_OPTIONS: TSSchemaCodegenOptions[] = [
  { mode: 'sidecar', models: true, importFrom: '../src/index.js' },
  { mode: 'module', models: true, outDir: 'res/module', importFrom: '../../src/index.js' },
  { mode: 'types', models: true, outDir: 'res/types', importFrom: '../../src/index.js' },
];

/**
 * Runs a callback with a fresh temporary directory, removed afterwards
 *
 * @param callback Callback to run
 */
function _withTempDir(callback: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'tsschema-codegen-'));
  try {
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('codegen', () => {
  describe('generateFiles', () => {
    it('Generates a sidecar declaration file exporting each top-level key, quoting keys which are not identifiers', () => {
      const [file, ...rest] = generateFiles('schemas/a.json', { title: 'a', 'x-vendor': [1, null], $defs: {} });
      expect(rest).toHaveLength(0);
      expect(file.path).toBe(join('schemas', 'a.d.json.ts'));
      expect(file.content).toContain('declare const _0: "a";');
      expect(file.content).toContain('declare const _1: readonly [\n  1,\n  null,\n];');
      expect(file.content).toContain('declare const _2: {};');
      expect(file.content).toContain('export { _0 as title, _1 as "x-vendor", _2 as $defs };');
    });

    it('Generates sidecar model types into a separate file, importing the JSON module', () => {
      const [, models] = generateFiles('schemas/a.json', { $defs: { A: {} } }, { models: true });
      expect(models.path).toBe(join('schemas', 'a.models.ts'));
      expect(models.content).toContain('import type schema from "./a.json";');
      expect(models.content).toContain('import type { TSSchemaFragment, TSSchemaType } from "@ofzza/tsschema";');
      expect(models.content).toContain('export type A = Models["A"];');
    });

    it('Generates a type alias only for fragment names which are valid, unreserved and not already declared', () => {
      const $defs = { Valid: {}, 'kebab-name': {}, string: {}, default: {}, Schema: {}, Models: {}, TSSchemaType: {} };
      const [, models] = generateFiles('a.json', { $defs }, { models: true });
      expect(models.content.match(/^export type \w+ = Models\[/gm)).toEqual(['export type Valid = Models[']);
    });

    it('Generates a single model type for a schema which is not a collection', () => {
      const [, models] = generateFiles('a.json', { type: 'string' }, { models: true });
      expect(models.content).toContain('import type { TSSchemaType } from "@ofzza/tsschema";');
      expect(models.content).toContain('export type Model = TSSchemaType<Schema>;');
      expect(models.content).not.toContain('Models');
    });

    it('Refuses to generate a sidecar declaration file for a schema which is not an object, or into an output directory', () => {
      expect(() => generateFiles('a.json', true)).toThrow(/requires a JSON object/);
      expect(() => generateFiles('a.json', [])).toThrow(/requires a JSON object/);
      expect(() => generateFiles('a.json', {}, { outDir: 'out' })).toThrow(/does not support an output directory/);
    });

    it('Generates an as const module checked against the collection or schema type', () => {
      const [collection] = generateFiles('a.json', { $defs: {} }, { mode: 'module' });
      expect(collection.path).toBe('a.schema.ts');
      expect(collection.content).toContain('import type { TSSchemaJSONCollection } from "@ofzza/tsschema";');
      expect(collection.content).toContain('const schema = {\n  "$defs": {}\n} as const;');
      expect(collection.content).toContain('export default schema satisfies TSSchemaJSONCollection;');
      const [schema] = generateFiles('a.json', { type: 'string' }, { mode: 'module' });
      expect(schema.content).toContain('export default schema satisfies TSSchemaJSONSchema;');
    });

    it('Generates a types only module, importing nothing unless model types are generated', () => {
      const [file] = generateFiles('a.json', true, { mode: 'types', outDir: 'out' });
      expect(file.path).toBe(join('out', 'a.schema.ts'));
      expect(file.content).toContain('// Generated by TSschema from ../a.json');
      expect(file.content).toContain('export type Schema = true;\n');
      expect(file.content).not.toContain('import');
    });

    it('Generates files which are up to date with every committed fixture', () => {
      const sources = readdirSync('res')
        .filter((file) => file.endsWith('.json'))
        .map((file) => join('res', file));
      for (const options of _FIXTURE_OPTIONS) {
        const { files } = generate(sources, { ...options, check: true });
        expect(files.filter((file) => file.status !== 'unchanged').map((file) => file.path)).toEqual([]);
      }
    });
  });

  describe('generate', () => {
    it('Writes generated files, and reports files which are already up to date as unchanged', () => {
      _withTempDir((dir) => {
        const source = join(dir, 'a.json');
        writeFileSync(source, '{ "$defs": { "A": { "type": "string" } } }');
        expect(generate([source]).files).toEqual([{ path: join(dir, 'a.d.json.ts'), source, status: 'written' }]);
        expect(readFileSync(join(dir, 'a.d.json.ts'), 'utf8')).toContain('export { _0 as $defs };');
        expect(generate([source]).files.map((file) => file.status)).toEqual(['unchanged']);
      });
    });

    it('Only reports out of date or missing files as stale when checking, without writing them', () => {
      _withTempDir((dir) => {
        const source = join(dir, 'a.json');
        writeFileSync(source, '{ "$defs": {} }');
        expect(generate([source], { mode: 'module', models: true, check: true }).files.map((file) => file.status)).toEqual(['stale']);
        expect(readdirSync(dir)).toEqual(['a.json']);
        generate([source], { mode: 'module', models: true });
        writeFileSync(source, '{ "$defs": { "A": {} } }');
        expect(generate([source], { mode: 'module', models: true, check: true }).files.map((file) => file.status)).toEqual(['stale']);
      });
    });

    it('Refuses to overwrite a file which was not generated by TSschema', () => {
      _withTempDir((dir) => {
        const source = join(dir, 'a.json');
        writeFileSync(source, '{ "$defs": {} }');
        writeFileSync(join(dir, 'a.schema.ts'), 'export const handWritten = true;\n');
        expect(() => generate([source], { mode: 'types' })).toThrow(/Refusing to overwrite/);
        expect(readFileSync(join(dir, 'a.schema.ts'), 'utf8')).toBe('export const handWritten = true;\n');
      });
    });
  });

  describe('Generated fixtures', () => {
    it('Types the schema identically in every output mode', () => {
      expect(true satisfies AssertTypeEquality<_ReadOnlyTopLevel<typeof schoolJson>, typeof schoolModule>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchoolTypes, typeof schoolModule>).toBe(true);
      expect(true satisfies AssertTypeEquality<_ReadOnlyTopLevel<typeof edgeJson>, typeof edgeModule>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeTypes, typeof edgeModule>).toBe(true);
    });

    it('Infers identical model types in every output mode', () => {
      expect(true satisfies AssertTypeEquality<SchoolSidecarModels, SchoolModuleModels>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchoolTypesModels, SchoolModuleModels>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarModels, EdgeModuleModels>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeTypesModels, EdgeModuleModels>).toBe(true);
    });

    it('Keeps literal types of values nested in keys which are not identifiers', () => {
      expect(true satisfies AssertTypeEquality<(typeof edgeJson)['x-vendor']['values'], readonly [true, null, -1.5, 'quote"d']>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarModels['kebab-name'], 'a' | 'b'>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarModels['string'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarPlain['kebab-property'], number>).toBe(true);
    });
  });
});
