import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaModelFragmentReflect,
  JSONSchemaPrimitiveTypeFragmentReflect,
  JSONSchemaReferenceFragmentReflect,
} from './index.js';

import { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'integer' }, mentor: { $ref: '#/$defs/Person' }, anything: true },
      required: ['name', 'age', 'email'],
    },
  },
} as const;
type _Schema = typeof _schema;
type _Person = _Schema['$defs']['Person'];

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Model fragment', () => {
      it('Detects a model', () => {
        expect(JSONSchemaModelFragmentReflect.check(_schema.$defs.Person)).toBe(true);
        expect(JSONSchemaModelFragmentReflect.check(jsonSchema.$defs.Assessment)).toBe(true);
        expect(JSONSchemaModelFragmentReflect.check({ type: 'object', properties: {} })).toBe(true);
      });

      it('Rejects a non-model', () => {
        expect(JSONSchemaModelFragmentReflect.check({ type: 'object' })).toBe(false);
        expect(JSONSchemaModelFragmentReflect.check({ properties: { a: { type: 'string' } } })).toBe(false);
        expect(JSONSchemaModelFragmentReflect.check({ type: 'string' })).toBe(false);
        expect(JSONSchemaModelFragmentReflect.check({ type: 'object', properties: [] } as any)).toBe(false);
      });

      it('Reflects a model', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person).toBeInstanceOf(JSONSchemaModelFragmentReflect);
        expect(person.type).toBe('object');
        expect(true satisfies AssertTypeEquality<typeof person, JSONSchemaModelFragmentReflect<_Schema, 'Person', _Person>>).toBe(true);
      });

      it('Gets the names of all properties of a model', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person.names).toEqual(['name', 'age', 'mentor', 'anything']);
        expect(true satisfies AssertTypeEquality<typeof person.names, Array<'name' | 'age' | 'mentor' | 'anything'>>).toBe(true);
      });

      it('Reflects each property of a model, by property name', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person.properties.name[0]).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentReflect);
        expect(person.properties.name[0].type).toBe('string');
        expect(person.properties.mentor[0]).toBeInstanceOf(JSONSchemaReferenceFragmentReflect);
        expect(person.properties.mentor[0].refName).toBe('Person');
        expect(
          true satisfies AssertTypeEquality<
            (typeof person.properties)['age'],
            Array<JSONSchemaPrimitiveTypeFragmentReflect<_Schema, undefined, _Person['properties']['age']>>
          >,
        ).toBe(true);
      });

      it('Reflects a boolean schema property with no reflections', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person.properties.anything).toEqual([]);
        expect(true satisfies AssertTypeEquality<(typeof person.properties)['anything'], never[]>).toBe(true);
      });

      it('Does not carry the readonly or optional modifiers of schema properties over to the reflected properties', () => {
        type Properties = JSONSchemaModelFragmentReflect<_Schema, undefined, { type: 'object'; properties: { readonly a?: { type: 'null' } } }>['properties'];
        expect(true satisfies AssertTypeEquality<keyof Properties, 'a'>).toBe(true);
        expect(true satisfies AssertTypeEquality<{ -readonly [K in keyof Properties]-?: Properties[K] }, Properties>).toBe(true);
      });

      it('Gets the names of the required properties of a model, leaving out names the model does not define', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person.required).toEqual(['name', 'age']);
        expect(true satisfies AssertTypeEquality<typeof person.required, Array<'name' | 'age'>>).toBe(true);
      });

      it('Gets no required properties of a model with no required keyword', () => {
        const collection = new JSONSchemaCollectionFragmentReflect({ $defs: { A: { type: 'object', properties: { a: { type: 'string' } } } } } as const);
        const a = collection.fragment('A')[0];
        expect(a.required).toEqual([]);
        expect(true satisfies AssertTypeEquality<typeof a.required, never[]>).toBe(true);
      });

      it('Infers the type of a model', () => {
        const _assessment = new JSONSchemaCollectionFragmentReflect(jsonSchema).fragment('Assessment')[0];
        type Assessment = typeof _assessment.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Assessment['weight'], number>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            Assessment,
            JSONSchemaFragmentType<JSONSchemaFixtureCollection['$defs']['Assessment'], JSONSchemaFixtureCollection>
          >,
        ).toBe(true);
      });
    });
  });
});
