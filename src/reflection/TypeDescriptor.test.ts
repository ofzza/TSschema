import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { parseJSONSchema, parseJSONSchemaCollection } from './JSONSchema/index.js';
import {
  getTSSchemaTypeDescriptor,
  type TSSchemaAllOfTypeDescriptor,
  type TSSchemaAnyOfTypeDescriptor,
  type TSSchemaArrayTypeDescriptor,
  type TSSchemaConstTypeDescriptor,
  type TSSchemaEnumTypeDescriptor,
  type TSSchemaModelTypeDescriptor,
  type TSSchemaNotTypeDescriptor,
  type TSSchemaNullTypeDescriptor,
  type TSSchemaOneOfTypeDescriptor,
  type TSSchemaPrimitiveTypeDescriptor,
  type TSSchemaRecordTypeDescriptor,
  type TSSchemaReferenceTypeDescriptor,
  type TSSchemaTypeDescriptor,
  type TSSchemaTypeDescriptorOf,
  type TSSchemaUnknownTypeDescriptor,
} from './TypeDescriptor.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from '../schema/JSONSchema/index.js';

import { default as enumJsonSchema } from '../../res/sidecar/enum.json';
import { default as jsonSchema } from '../../res/sidecar/schema.json';

/**
 * Describes a schema with no `$defs` at runtime, and infers its descriptor at type level
 */
function _describe<const TFragment extends JSONSchemaNotCollectionFragment>(fragment: TFragment): TSSchemaTypeDescriptorOf<JSONSchemaCollection, TFragment> {
  return getTSSchemaTypeDescriptor(parseJSONSchema(fragment)) as TSSchemaTypeDescriptorOf<JSONSchemaCollection, TFragment>;
}

/**
 * Schema collection with a recursive definition
 */
const _schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: { name: { type: 'string' }, mentor: { $ref: '#/$defs/Person' } },
      required: ['name'],
    },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('TypeDescriptor', () => {
    describe('getTSSchemaTypeDescriptor', () => {
      it('Describes a fragment with no type keywords as unknown', () => {
        const descriptor = _describe({ description: 'Anything' });
        expect(descriptor).toEqual({ kind: 'unknown' });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaUnknownTypeDescriptor>).toBe(true);
      });

      it('Describes a constant', () => {
        const descriptor = _describe({ const: 'a' });
        expect(descriptor).toEqual({ kind: 'const', value: 'a' });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaConstTypeDescriptor<'a'>>).toBe(true);
      });

      it('Describes an enum, naming each value by its own name', () => {
        const descriptor = _describe({ enum: ['a', 1, null] });
        expect(descriptor).toEqual({ kind: 'enum', values: ['a', 1, null], names: ['a', '1', 'null'] });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaEnumTypeDescriptor<readonly ['a', 1, null], readonly ['a', '1', 'null']>>).toBe(
          true,
        );
      });

      it('Describes an enum, naming its values by `x-enumNames`', () => {
        const descriptor = getTSSchemaTypeDescriptor(parseJSONSchemaCollection(enumJsonSchema).$defs.NamedEnum);
        expect(descriptor).toEqual({ kind: 'enum', values: [1, 2, 3], names: ['One', 'Two', 'Three'] });
        expect(_describe({ enum: ['a', 'b'], 'x-enumNames': ['A'] })).toEqual({ kind: 'enum', values: ['a', 'b'], names: ['a', 'b'] });
        const _named = _describe({ enum: ['a', 'b'], 'x-enumNames': ['A', 'B'] });
        expect(true satisfies AssertTypeEquality<typeof _named, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['A', 'B']>>).toBe(true);
        const _misnamed = _describe({ enum: ['a', 'b'], 'x-enumNames': ['A'] });
        expect(true satisfies AssertTypeEquality<typeof _misnamed, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['a', 'b']>>).toBe(true);
      });

      it('Describes a oneOf of constants as an enum, naming its values by their titles', () => {
        const descriptor = _describe({ type: 'integer', oneOf: [{ const: 0, title: 'Zero' }, { const: 1 }] });
        expect(descriptor).toEqual({ kind: 'enum', values: [0, 1], names: ['Zero', '1'] });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaEnumTypeDescriptor<readonly [0, 1], readonly ['Zero', '1']>>).toBe(true);

        const kind = getTSSchemaTypeDescriptor(parseJSONSchemaCollection(jsonSchema).$defs.AssessmentKind);
        expect(kind).toMatchObject({ kind: 'enum', values: [0, 1, 2, 3, 4, 5, 6, 7] });
        expect(kind.kind === 'enum' && kind.names.slice(0, 2)).toEqual(['Quiz', 'MidtermExam']);
      });

      it('Describes a oneOf of anything other than only constants as a oneOf', () => {
        const descriptor = _describe({ oneOf: [{ const: 0 }, { type: 'string' }] });
        expect(descriptor).toEqual({
          kind: 'oneOf',
          members: [
            { kind: 'const', value: 0 },
            { kind: 'primitive', type: 'string' },
          ],
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof descriptor,
            TSSchemaOneOfTypeDescriptor<readonly [TSSchemaConstTypeDescriptor<0>, TSSchemaPrimitiveTypeDescriptor<'string'>]>
          >,
        ).toBe(true);
      });

      it('Describes a primitive type, and several as an implicit anyOf', () => {
        const string = _describe({ type: 'string' });
        expect(string).toEqual({ kind: 'primitive', type: 'string' });
        expect(true satisfies AssertTypeEquality<typeof string, TSSchemaPrimitiveTypeDescriptor<'string'>>).toBe(true);

        const several = _describe({ type: ['string', 'integer'] });
        expect(several).toEqual({
          kind: 'anyOf',
          members: [
            { kind: 'primitive', type: 'string' },
            { kind: 'primitive', type: 'integer' },
          ],
          implicit: true,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof several,
            TSSchemaAnyOfTypeDescriptor<readonly [TSSchemaPrimitiveTypeDescriptor<'string'>, TSSchemaPrimitiveTypeDescriptor<'integer'>], true>
          >,
        ).toBe(true);
      });

      it('Describes the null type, and a nullable type as an implicit anyOf', () => {
        const nullType = _describe({ type: 'null' });
        expect(nullType).toEqual({ kind: 'null' });
        expect(true satisfies AssertTypeEquality<typeof nullType, TSSchemaNullTypeDescriptor>).toBe(true);

        const nullable = _describe({ type: ['string', 'null'] });
        expect(nullable).toEqual({ kind: 'anyOf', members: [{ kind: 'null' }, { kind: 'primitive', type: 'string' }], implicit: true });
        expect(
          true satisfies AssertTypeEquality<
            typeof nullable,
            TSSchemaAnyOfTypeDescriptor<ReadonlyArray<TSSchemaNullTypeDescriptor | TSSchemaPrimitiveTypeDescriptor<'string'>>, boolean>
          >,
        ).toBe(true);
      });

      it('Describes an array by its items', () => {
        const descriptor = _describe({ type: 'array', items: { type: 'number' } });
        expect(descriptor).toEqual({ kind: 'array', items: { kind: 'primitive', type: 'number' } });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaArrayTypeDescriptor<TSSchemaPrimitiveTypeDescriptor<'number'>>>).toBe(true);

        const untyped = _describe({ type: 'array' });
        expect(untyped).toEqual({ kind: 'array', items: { kind: 'unknown' } });
        expect(true satisfies AssertTypeEquality<typeof untyped, TSSchemaArrayTypeDescriptor<TSSchemaUnknownTypeDescriptor>>).toBe(true);
      });

      it('Describes an object with no properties as a record of unknown values', () => {
        const descriptor = _describe({ type: 'object' });
        expect(descriptor).toEqual({ kind: 'record', values: { kind: 'unknown' } });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaRecordTypeDescriptor<TSSchemaUnknownTypeDescriptor>>).toBe(true);
      });

      it('Describes a model by its properties, and which of them are required', () => {
        const descriptor = _describe({ type: 'object', properties: { id: { type: 'string' }, note: true }, required: ['id'] });
        expect(descriptor).toEqual({
          kind: 'model',
          properties: { id: { kind: 'primitive', type: 'string' }, note: { kind: 'unknown' } },
          required: ['id'],
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof descriptor,
            TSSchemaModelTypeDescriptor<
              { readonly id: TSSchemaPrimitiveTypeDescriptor<'string'>; readonly note: TSSchemaUnknownTypeDescriptor },
              ReadonlyArray<'id'>
            >
          >,
        ).toBe(true);
      });

      it('Describes allOf, anyOf and not', () => {
        const allOf = _describe({ allOf: [{ type: 'string' }, { const: 'a' }] });
        expect(allOf).toEqual({
          kind: 'allOf',
          members: [
            { kind: 'primitive', type: 'string' },
            { kind: 'const', value: 'a' },
          ],
          implicit: false,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof allOf,
            TSSchemaAllOfTypeDescriptor<readonly [TSSchemaPrimitiveTypeDescriptor<'string'>, TSSchemaConstTypeDescriptor<'a'>], false>
          >,
        ).toBe(true);

        const anyOf = _describe({ anyOf: [{ type: 'string' }, { type: 'null' }] });
        expect(anyOf).toEqual({ kind: 'anyOf', members: [{ kind: 'primitive', type: 'string' }, { kind: 'null' }], implicit: false });
        expect(
          true satisfies AssertTypeEquality<
            typeof anyOf,
            TSSchemaAnyOfTypeDescriptor<readonly [TSSchemaPrimitiveTypeDescriptor<'string'>, TSSchemaNullTypeDescriptor], false>
          >,
        ).toBe(true);

        const not = _describe({ not: { type: 'boolean' } });
        expect(not).toEqual({ kind: 'not', not: { kind: 'primitive', type: 'boolean' } });
        expect(true satisfies AssertTypeEquality<typeof not, TSSchemaNotTypeDescriptor<TSSchemaPrimitiveTypeDescriptor<'boolean'>>>).toBe(true);
      });

      it('Absorbs the type alongside an enum or const', () => {
        const enumeration = _describe({ type: 'string', enum: ['a', 'b'] });
        expect(enumeration).toEqual({ kind: 'enum', values: ['a', 'b'], names: ['a', 'b'] });
        expect(true satisfies AssertTypeEquality<typeof enumeration, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['a', 'b']>>).toBe(true);

        const nullable = _describe({ type: ['string', 'null'], enum: ['a', null] });
        expect(nullable).toEqual({ kind: 'enum', values: ['a', null], names: ['a', 'null'] });
        expect(true satisfies AssertTypeEquality<typeof nullable, TSSchemaEnumTypeDescriptor<readonly ['a', null], readonly ['a', 'null']>>).toBe(true);
      });

      it('Describes several keywords of one fragment as an implicit allOf', () => {
        const descriptor = _describe({ type: 'string', not: { const: '' } });
        expect(descriptor).toEqual({
          kind: 'allOf',
          members: [
            { kind: 'primitive', type: 'string' },
            { kind: 'not', not: { kind: 'const', value: '' } },
          ],
          implicit: true,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof descriptor,
            TSSchemaAllOfTypeDescriptor<
              ReadonlyArray<TSSchemaPrimitiveTypeDescriptor<'string'> | TSSchemaNotTypeDescriptor<TSSchemaConstTypeDescriptor<''>>>,
              true
            >
          >,
        ).toBe(true);
      });

      it('Describes a reference lazily, by the same descriptor as its definition', () => {
        const collection = parseJSONSchemaCollection(_schema);
        const person = getTSSchemaTypeDescriptor(collection.$defs.Person);
        expect(person.properties.name).toEqual({ kind: 'primitive', type: 'string' });
        const mentor = person.properties.mentor;
        expect([mentor.kind, mentor.name]).toEqual(['reference', 'Person']);
        expect(mentor.target).toBe(person);
        expect(mentor.target.properties.mentor.target).toBe(person);
        expect(true satisfies AssertTypeEquality<typeof mentor.name, 'Person'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof mentor.target.properties.name, TSSchemaPrimitiveTypeDescriptor<'string'>>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof person.required, ReadonlyArray<'name'>>).toBe(true);
      });

      it('Describes a reference which can not be resolved as unknown', () => {
        const missing = getTSSchemaTypeDescriptor(parseJSONSchemaCollection({ $defs: { Broken: { $ref: '#/$defs/Missing' } } } as const).$defs.Broken);
        expect(missing).toEqual({ kind: 'unknown' });
        expect(true satisfies AssertTypeEquality<typeof missing, TSSchemaUnknownTypeDescriptor>).toBe(true);

        // With no collection known at type level, a reference may or may not resolve; at runtime, with no `$defs`, it never does
        const uncollected = _describe({ $ref: '#/$defs/Missing' });
        expect(uncollected).toEqual({ kind: 'unknown' });
        expect(
          true satisfies AssertTypeEquality<
            typeof uncollected,
            TSSchemaReferenceTypeDescriptor<'Missing', TSSchemaTypeDescriptor> | TSSchemaUnknownTypeDescriptor
          >,
        ).toBe(true);
      });

      it('Returns the same descriptor for the same facets', () => {
        const facets = parseJSONSchema({ type: 'string' });
        expect(getTSSchemaTypeDescriptor(facets)).toBe(getTSSchemaTypeDescriptor(facets));
      });
    });

    describe('TSSchemaTypeDescriptorOf', () => {
      it('Infers any descriptor for the unspecified fragment', () => {
        expect(true satisfies AssertTypeEquality<TSSchemaTypeDescriptorOf<JSONSchemaCollection, JSONSchemaNotCollectionFragment>, TSSchemaTypeDescriptor>).toBe(
          true,
        );
      });

      it('Infers the descriptor of a definition', () => {
        expect(true satisfies AssertTypeEquality<TSSchemaTypeDescriptorOf<_Schema, _Schema['$defs']['Person']>['properties']['mentor']['name'], 'Person'>).toBe(
          true,
        );
      });
    });
  });
});
