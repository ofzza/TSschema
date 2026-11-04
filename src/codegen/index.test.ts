import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AssertTypeAssignable, AssertTypeEquality, AssertTypeUnassignable } from '@ofzza/tsstd';
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
import type { Models as EnumSidecarModels } from '../../res/sidecar/enum.models.js';
import type * as EnumSidecarModelsModule from '../../res/sidecar/enum.models.js';
import { NamedEnum as SidecarNamedEnum } from '../../res/sidecar/enum.models.js';
import {
  Enum as ModuleEnum,
  NamedEnum as ModuleNamedEnum,
  QuotedEnum as ModuleQuotedEnum,
  TitledEnum as ModuleTitledEnum,
} from '../../res/module/enum.schema.js';
import type { Models as EnumModuleModels } from '../../res/module/enum.schema.js';
import { Enum as TypesEnum, MixedEnum as TypesMixedEnum, NullableEnum as TypesNullableEnum } from '../../res/types/enum.schema.js';
import type { Models as EnumTypesModels } from '../../res/types/enum.schema.js';
import { AssessmentKind } from '../../res/module/schema.js';
import type { Models as SchemaEnumModels } from '../../res/module/schema.js';

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
  { sourceDir: 'res/sidecar', mode: 'sidecar', models: true, enums: 'enum', importFrom: '../../src/index.js' },
  { sourceDir: 'res', mode: 'module', models: true, enums: 'enum', outDir: 'res/module', importFrom: '../../src/index.js' },
  { sourceDir: 'res', mode: 'types', models: true, enums: 'object', outDir: 'res/types', importFrom: '../../src/index.js' },
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
  // Code generation from JSON schema files, in all three modes (sidecar, module, types). Runtime tests check the generated paths and
  // contents of small inline schemas, temporary directories under os.tmpdir() the reading and writing of files, and the committed res/
  // fixtures are both compared to what the generator would produce now and asserted, at type level, to type the schema identically in
  // every mode.
  describe('generateFiles', () => {
    // Pure generation, JSON in and files out, so no file system is involved, except for the fixture freshness checks reading res/.
    it('Generates a sidecar declaration file exporting each top-level key, quoting keys which are not identifiers', () => {
      // See AGENTS.md › A JSON sidecar must declare each top-level key as a named export, never `export default`.
      const [file, ...rest] = generateFiles('schemas/a.json', { title: 'a', 'x-vendor': [1, null], $defs: {} });
      expect(rest).toHaveLength(0);
      expect(file.path).toBe(join('schemas', 'a.d.json.ts'));
      expect(file.content).toContain('declare const _0: "a";');
      expect(file.content).toContain('declare const _1: readonly [\n  1,\n  null,\n];');
      expect(file.content).toContain('declare const _2: {};');
      expect(file.content).toContain('export { _0 as title, _1 as "x-vendor", _2 as $defs };');
    });

    it('Generates sidecar model types into a separate file, importing the JSON module', () => {
      // See AGENTS.md › `module: nodenext` forbids named imports from a JSON file.
      const [, models] = generateFiles('schemas/a.json', { $defs: { A: {} } }, { models: true });
      expect(models.path).toBe(join('schemas', 'a.models.ts'));
      expect(models.content).toContain('import type schema from "./a.json";');
      expect(models.content).toContain('import type { TSSchemaFragment, TSSchemaType } from "@ofzza/tsschema";');
      expect(models.content).toContain('export type A = Models["A"];');
    });

    it('Generates a type alias only for definition names which are valid, unreserved and not already declared', () => {
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
      // A sidecar declares one named export per top-level key, and must sit next to its JSON file to be picked up.
      expect(() => generateFiles('a.json', true)).toThrow(/requires a JSON object/);
      expect(() => generateFiles('a.json', [])).toThrow(/requires a JSON object/);
      expect(() => generateFiles('a.json', {}, { outDir: 'out' })).toThrow(/does not support an output directory/);
    });

    it('Generates an as const module checked against the collection or schema type', () => {
      // `satisfies` is applied to the identifier, not the literal. See AGENTS.md › Generated `module` mode applies `satisfies` to the identifier.
      const [collection] = generateFiles('a.json', { $defs: {} }, { mode: 'module' });
      expect(collection.path).toBe('a.schema.ts');
      expect(collection.content).toContain('import type { TSSchemaJSONCollection } from "@ofzza/tsschema";');
      expect(collection.content).toContain('const schema = {\n  "$defs": {}\n} as const;');
      expect(collection.content).toContain('export default schema satisfies TSSchemaJSONCollection;');
      const [schema] = generateFiles('a.json', { type: 'string' }, { mode: 'module' });
      expect(schema.content).toContain('export default schema satisfies TSSchemaJSONSchema;');
    });

    it('Names a module or types only module without doubling a schema suffix the JSON file name already has', () => {
      // See AGENTS.md › `module` / `types` mode names drop a doubled `schema` suffix.
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

    it('Generates the enums of a collection as TS enums into a separate file, re-exported by name instead of their type aliases', () => {
      // An enum replaces its definition's type alias, as both would be exported under the same name. The re-export names each enum, as a local
      // declaration of the same name would silently shadow it in an `export *`.
      const $defs = { Plain: { enum: ['a', 'kebab-value'] }, Named: { enum: [1, 2, null], 'x-enumNames': ['One', 'Two', 'Null'] }, Model: {}, Other: {} };
      const [file, enums] = generateFiles('a.json', { $defs }, { mode: 'module', models: true, enums: 'enum' });
      expect(enums.path).toBe('a.enums.ts');
      expect(enums.content).toContain('// Generated by TSschema from ./a.json');
      expect(enums.content).toContain(
        'export enum Plain {\n  a = "a",\n  "kebab-value" = "kebab-value",\n}\n\nexport enum Named {\n  One = 1,\n  Two = 2,\n}\n',
      );
      expect(file.content).toContain(
        'import type { TSSchemaJSONCollection, TSSchemaFragment, TSSchemaType } from "@ofzza/tsschema";\nexport { Plain, Named } from "./a.enums.js";\n',
      );
      expect(file.content.match(/^export type \w+ = Models\[/gm)).toEqual(['export type Other = Models[']);
    });

    it('Generates the enums of a collection as as const objects, each with a type of the same name', () => {
      const [, enums] = generateFiles('a.json', { $defs: { A: { enum: ['a', 1], 'x-enumNames': ['a', 'One'] } } }, { mode: 'module', enums: 'object' });
      expect(enums.content).toContain('export const A = {\n  a: "a",\n  One: 1,\n} as const;\nexport type A = (typeof A)[keyof typeof A];\n');
    });

    it('Generates an enum for every enum idiom reflection recognises, and for definitions only', () => {
      // A oneOf of titled consts (dotnetschema's idiom) is an enum named by the titles; an inline enum has no name to generate it under.
      const $defs = {
        Titled: {
          type: 'integer',
          oneOf: [
            { const: 0, title: 'Zero' },
            { const: 1, title: 'One' },
          ],
        },
        Model: { type: 'object', properties: { inline: { enum: ['a'] } } },
      };
      const [, enums] = generateFiles('a.json', { $defs }, { mode: 'types', enums: 'enum' });
      expect(enums.content.match(/^export enum \w+/gm)).toEqual(['export enum Titled']);
      expect(enums.content).toContain('  Zero = 0,\n  One = 1,\n');
    });

    it('Skips enums which can not be generated, keeping their type aliases', () => {
      // TypeScript rejects numeric and duplicate enum member names, and only allows string and number values; a definition name must be usable as a
      // type alias name too.
      const $defs = {
        Numeric: { enum: [1, 2] },
        Duplicate: { enum: ['a', 'b'], 'x-enumNames': ['Same', 'Same'] },
        Boolean: { enum: [true, false] },
        'kebab-name': { enum: ['a'] },
        Schema: { enum: ['a'] },
        Valid: { enum: ['a'] },
      };
      const [file, enums] = generateFiles('a.json', { $defs }, { mode: 'types', models: true, enums: 'enum' });
      expect(enums.content.match(/^export enum \w+/gm)).toEqual(['export enum Valid']);
      expect(file.content).toContain('export { Valid } from "./a.enums.js";');
      expect(file.content.match(/^export type \w+ = Models\[/gm)).toEqual([
        'export type Numeric = Models[',
        'export type Duplicate = Models[',
        'export type Boolean = Models[',
      ]);
    });

    it('Generates an empty enums module, and no re-export, for a schema defining no enums', () => {
      // The file is still generated, so a previously generated one never lingers out of date.
      for (const json of [{ $defs: { A: { type: 'string' } } }, { enum: ['a'] }, true]) {
        const [file, enums] = generateFiles('a.json', json, { mode: 'types', enums: 'enum' });
        expect(enums.content).toMatch(/\*\/\nexport \{\};\n$/);
        expect(file.content).not.toContain('enums');
      }
    });

    it('Generates enums next to the generated module, also into an output directory', () => {
      const [file, enums] = generateFiles('schemas/a.schema.json', { $defs: { A: { enum: ['a'] } } }, { mode: 'types', enums: 'enum', outDir: 'out' });
      expect([file.path, enums.path]).toEqual([join('out', 'a.schema.ts'), join('out', 'a.schema.enums.ts')]);
      expect(file.content).toContain('export { A } from "./a.schema.enums.js";\n\nexport type Schema = ');
      expect(enums.content).toContain('// Generated by TSschema from ../schemas/a.schema.json');
    });

    it('Generates sidecar enums into a separate file, re-exported from the model types only', () => {
      // A declaration file can not re-export values, so without model types the enums file is imported directly.
      const json = { $defs: { A: { enum: ['a'] } } };
      const [sidecar, models, enums] = generateFiles('a.json', json, { models: true, enums: 'enum' });
      expect([sidecar.path, models.path, enums.path]).toEqual(['a.d.json.ts', 'a.models.ts', 'a.enums.ts']);
      expect(sidecar.content).not.toContain('enums');
      expect(models.content).toContain('export { A } from "./a.enums.js";');
      expect(models.content).not.toContain('export type A =');
      expect(generateFiles('a.json', json, { enums: 'enum' }).map((file) => file.path)).toEqual(['a.d.json.ts', 'a.enums.ts']);
    });

    it('Refuses an unknown enums form', () => {
      expect(() => generateFiles('a.json', {}, { enums: 'union' as any })).toThrow(/Unknown enums form 'union'/);
    });

    it('Generates files which are up to date with every committed fixture', () => {
      // The fixture freshness check: fails while any committed res/ fixture differs from what the generator produces now, using the options
      // of the `fixtures` npm scripts (see _FIXTURE_OPTIONS). Run `npm run fixtures` to update them.
      for (const { sourceDir, ...options } of _FIXTURE_OPTIONS) {
        const sources = _listJsonFiles(sourceDir).map((file) => join(sourceDir, file));
        const { files } = generate(sources, { ...options, check: true });
        expect(files.filter((file) => file.status !== 'unchanged').map((file) => file.path)).toEqual([]);
      }
    });

    it('Keeps the committed sidecar fixtures generated from up to date copies of every JSON fixture', () => {
      // res/sidecar/ holds copies of res/*.json, as a sidecar must sit next to its JSON file; res/*.json stays the source of truth.
      expect(_listJsonFiles('res/sidecar')).toEqual(_listJsonFiles('res'));
      for (const file of _listJsonFiles('res')) {
        expect(readFileSync(join('res/sidecar', file), 'utf8')).toBe(readFileSync(join('res', file), 'utf8'));
      }
    });
  });

  describe('generate', () => {
    // Reading the JSON files and writing or checking the generated files, each test in a fresh temporary directory.
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
      // Only a file starting with the `// Generated by TSschema` header may be overwritten.
      _withTempDir((dir) => {
        const source = join(dir, 'a.json');
        writeFileSync(source, '{ "$defs": {} }');
        writeFileSync(join(dir, 'a.schema.ts'), 'export const handWritten = true;\n');
        expect(() => generate([source], { mode: 'types' })).toThrow(/Refusing to overwrite/);
        expect(readFileSync(join(dir, 'a.schema.ts'), 'utf8')).toBe('export const handWritten = true;\n');
      });
    });

    it('Refuses to generate the same file from more than one JSON file, without writing any file', () => {
      // a.json and a.schema.json both generate a.schema.ts in module mode, while the same source passed twice is not a collision.
      // See AGENTS.md › `module` / `types` mode names drop a doubled `schema` suffix.
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
    // Over the committed res/ fixtures as imported in each mode: schema.json as the realistic case, edge.json for non-identifier, reserved and
    // colliding names, and enum.json for the generated enums (TS enums in the sidecar and module fixtures, as const objects in the types
    // fixtures), whose values are checked at runtime and whose types against the inferred model types.
    it('Types the schema identically in every output mode', () => {
      // A sidecar-typed JSON import is a module namespace, whose top-level members are not `readonly`, so it is compared through
      // _ReadOnlyTopLevel. See AGENTS.md › The type of a sidecar-typed JSON import is a module namespace.
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

    it('Generates enums usable at runtime, re-exported from the module, types and model types files', () => {
      // res/enum.json covers every enum idiom and every skipped kind of enum; res/schema.json dotnetschema's oneOf enums.
      expect(ModuleNamedEnum.Two).toBe(2);
      expect(SidecarNamedEnum.Three).toBe(3);
      expect(ModuleTitledEnum.One).toBe(1);
      expect(ModuleQuotedEnum['kebab-value']).toBe('kebab-value');
      expect(AssessmentKind.MidtermExam).toBe(1);
      expect(TypesEnum.Bbb).toBe('Bbb');
      expect(TypesMixedEnum).toEqual({ Text: 'text', Negative: -1.5 });
      expect(TypesNullableEnum).toEqual({ Aaa: 'Aaa' });
      // Only the generated enums are re-exported as values; the skipped ones keep their type aliases instead
      expect(
        true satisfies AssertTypeEquality<
          keyof typeof EnumSidecarModelsModule,
          'Enum' | 'NamedEnum' | 'TitledEnum' | 'NullableEnum' | 'MixedEnum' | 'QuotedEnum'
        >,
      ).toBe(true);
      expect(true satisfies AssertTypeEquality<EnumSidecarModelsModule.NumericNamesEnum, 1 | 2 | 3>).toBe(true);
    });

    it('Generates enums compatible with the inferred model types', () => {
      // See AGENTS.md › Generated enums are typed apart from the inferred model types. Every enum value fits its definition's inferred type, and a
      // numeric literal fits a numeric enum, but a string literal does not fit a string enum (it does fit an as const object's type, which is
      // the union of its values).
      expect(true satisfies AssertTypeAssignable<ModuleEnum, EnumModuleModels['Enum']>).toBe(true);
      expect(true satisfies AssertTypeAssignable<ModuleNamedEnum, EnumModuleModels['NamedEnum']>).toBe(true);
      expect(true satisfies AssertTypeAssignable<AssessmentKind, SchemaEnumModels['AssessmentKind']>).toBe(true);
      expect(true satisfies AssertTypeAssignable<EnumModuleModels['NamedEnum'], ModuleNamedEnum>).toBe(true);
      expect(true satisfies AssertTypeUnassignable<EnumModuleModels['Enum'], ModuleEnum>).toBe(true);
      expect(true satisfies AssertTypeEquality<TypesEnum, EnumTypesModels['Enum']>).toBe(true);
      expect(true satisfies AssertTypeEquality<TypesMixedEnum, EnumTypesModels['MixedEnum']>).toBe(true);
      // An enum holds no null member: a nullable enum's inferred type is the enum's type or null
      expect(true satisfies AssertTypeEquality<TypesNullableEnum | null, EnumTypesModels['NullableEnum']>).toBe(true);
      expect(true satisfies AssertTypeEquality<EnumSidecarModels, EnumModuleModels>).toBe(true);
    });

    it('Keeps literal types of values nested in keys which are not identifiers', () => {
      expect(true satisfies AssertTypeEquality<(typeof edgeJson)['x-vendor']['values'], readonly [true, null, -1.5, 'quote"d']>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarModels['kebab-name'], 'a' | 'b'>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarModels['string'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<EdgeSidecarPlain['kebab-property'], number>).toBe(true);
    });
  });
});
