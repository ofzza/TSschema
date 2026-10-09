import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { generate, generateFiles, type TSSchemaCodegenOptions } from './index.js';

import type { default as schemaJson } from '../../res/sidecar/schema.json';
import type { default as schemaModule } from '../../res/module/schema.js';
import type { Schema as SchemaTypes } from '../../res/types/schema.js';
import type { Models as SchemaSidecarModels } from '../../res/sidecar/schema.models.js';
import type { Models as SchemaModuleModels } from '../../res/module/schema.js';
import type { Models as SchemaTypesModels } from '../../res/types/schema.js';
import type { default as edgeJson } from '../../res/sidecar/edge.json';
import type { default as edgeModule } from '../../res/module/edge.schema.js';
import type { Schema as EdgeTypes } from '../../res/types/edge.schema.js';
import type { Models as EdgeSidecarModels, Plain as EdgeSidecarPlain } from '../../res/sidecar/edge.models.js';
import type { Models as EdgeModuleModels } from '../../res/module/edge.schema.js';
import type { Models as EdgeTypesModels } from '../../res/types/edge.schema.js';

/**
 * Makes the top-level properties of a type read-only. The type of a JSON module is its module namespace, whose members are not marked read-only, while
 * everything below them is
 */
type _ReadOnlyTopLevel<T> = { readonly [K in keyof T]: T[K] };

/**
 * Code generation options the committed `res/` fixtures were generated with, and the directory of the JSON files they were generated from (see the
 * `fixtures` npm scripts)
 */
const _FIXTURE_OPTIONS: (TSSchemaCodegenOptions & { sourceDir: string })[] = [
  { sourceDir: 'res/sidecar', mode: 'sidecar', models: true, importFrom: '../../src/index.js' },
  { sourceDir: 'res', mode: 'module', models: true, outDir: 'res/module', importFrom: '../../src/index.js' },
  { sourceDir: 'res', mode: 'types', models: true, outDir: 'res/types', importFrom: '../../src/index.js' },
];

/**
 * Lists the JSON files in a directory
 *
 * @param dir Directory to list
 * @returns Names of the JSON files, sorted
 */
function _listJsonFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort();
}

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

    it('Names a module or types only module without doubling a schema suffix the JSON file name already has', () => {
      for (const mode of ['module', 'types'] as const) {
        expect(generateFiles('schema.json', {}, { mode })[0].path).toBe('schema.ts');
        expect(generateFiles('Schema.json', {}, { mode })[0].path).toBe('Schema.ts');
        expect(generateFiles('a.schema.json', {}, { mode })[0].path).toBe('a.schema.ts');
        expect(generateFiles('a-schema.json', {}, { mode })[0].path).toBe('a-schema.schema.ts');
      }
      expect(generateFiles('schema.json', {}, { models: true }).map((file) => file.path)).toEqual(['schema.d.json.ts', 'schema.models.ts']);
    });

    it('Generates a types only module, importing nothing unless model types are generated', () => {
      const [file] = generateFiles('a.json', true, { mode: 'types', outDir: 'out' });
      expect(file.path).toBe(join('out', 'a.schema.ts'));
      expect(file.content).toContain('// Generated by TSschema from ../a.json');
      expect(file.content).toContain('export type Schema = true;\n');
      expect(file.content).not.toContain('import');
    });

    it('Generates files which are up to date with every committed fixture', () => {
      for (const { sourceDir, ...options } of _FIXTURE_OPTIONS) {
        const sources = _listJsonFiles(sourceDir).map((file) => join(sourceDir, file));
        const { files } = generate(sources, { ...options, check: true });
        expect(files.filter((file) => file.status !== 'unchanged').map((file) => file.path)).toEqual([]);
      }
    });

    it('Keeps the committed sidecar fixtures generated from up to date copies of every JSON fixture', () => {
      expect(_listJsonFiles('res/sidecar')).toEqual(_listJsonFiles('res'));
      for (const file of _listJsonFiles('res')) {
        expect(readFileSync(join('res/sidecar', file), 'utf8')).toBe(readFileSync(join('res', file), 'utf8'));
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

    it('Refuses to generate the same file from more than one JSON file, without writing any file', () => {
      _withTempDir((dir) => {
        const sources = [join(dir, 'a.json'), join(dir, 'a.schema.json'), join(dir, 'b.json')];
        for (const source of sources) {
          writeFileSync(source, '{}');
        }
        expect(() => generate(sources, { mode: 'module' })).toThrow(/Refusing to generate .*a\.schema\.ts from both/);
        expect(readdirSync(dir).sort()).toEqual(['a.json', 'a.schema.json', 'b.json']);
        expect(generate([sources[2], sources[2]], { mode: 'module' }).files).toHaveLength(1);
      });
    });
  });

  describe('Generated fixtures', () => {
    it('Types the schema identically in every output mode', () => {
      expect(true satisfies AssertTypeEquality<_ReadOnlyTopLevel<typeof schemaJson>, typeof schemaModule>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchemaTypes, typeof schemaModule>).toBe(true);
      expect(true satisfies AssertTypeEquality<_ReadOnlyTopLevel<typeof edgeJson>, typeof edgeModule>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeTypes, typeof edgeModule>).toBe(true);
    });

    it('Infers identical model types in every output mode', () => {
      expect(true satisfies AssertTypeEquality<SchemaSidecarModels, SchemaModuleModels>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchemaTypesModels, SchemaModuleModels>).toBe(true);
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
