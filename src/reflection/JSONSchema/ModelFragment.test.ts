import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaPrimitiveTypeFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
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
      minProperties: 2,
    },
  },
} as const;
type _Schema = typeof _schema;
type _Person = _Schema['$defs']['Person'];

describe('Reflection', () => {
  // Runtime tests of ModelFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/ModelFragment.test.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Model fragment', () => {
      // JSONSchemaModelFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsModel), the property `names`, the facets of each property (parsed on
      // construction), the `required` names, the validation keywords of objects and the type-only `Type`. Facets are taken from a JSONSchemaCollectionFragmentFacet parsing the small inline
      // collection above (a recursive Person with a boolean schema property and a `required` naming an undefined property) and the res/schema.json fixture.
      // Each runtime `expect` on a parsed value is paired with an AssertTypeEquality on its static type.
      it('Detects a model', () => {
        expect(JSONSchemaModelFragmentFacet.is(_schema.$defs.Person)).toBe(true);
        expect(JSONSchemaModelFragmentFacet.is(jsonSchema.$defs.Assessment)).toBe(true);
        expect(JSONSchemaModelFragmentFacet.is({ type: 'object', properties: {} })).toBe(true);
      });

      it('Rejects a non-model', () => {
        expect(JSONSchemaModelFragmentFacet.is({ type: 'object' })).toBe(false);
        expect(JSONSchemaModelFragmentFacet.is({ properties: { a: { type: 'string' } } })).toBe(false);
        expect(JSONSchemaModelFragmentFacet.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaModelFragmentFacet.is({ type: 'object', properties: [] } as any)).toBe(false);
      });

      it('Parses a model', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person).toBeInstanceOf(JSONSchemaModelFragmentFacet);
        expect(person.type).toBe('object');
        expect(true satisfies AssertTypeEquality<typeof person, JSONSchemaModelFragmentFacet<_Schema, 'Person', _Person>>).toBe(true);
      });

      it('Gets the names of all properties of a model', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person.names).toEqual(['name', 'age', 'mentor', 'anything']);
        expect(true satisfies AssertTypeEquality<typeof person.names, Array<'name' | 'age' | 'mentor' | 'anything'>>).toBe(true);
      });

      it('Parses each property of a model, by property name', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person.properties.name[0]).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
        expect(person.properties.name[0].type).toBe('string');
        expect(person.properties.mentor[0]).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(person.properties.mentor[0].refName).toBe('Person');
        expect(
          true satisfies AssertTypeEquality<
            (typeof person.properties)['age'],
            Array<JSONSchemaPrimitiveTypeFragmentFacet<_Schema, undefined, _Person['properties']['age']>>
          >,
        ).toBe(true);
      });

      it('Parses a boolean schema property with no facets', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person.properties.anything).toEqual([]);
        expect(true satisfies AssertTypeEquality<(typeof person.properties)['anything'], never[]>).toBe(true);
      });

      it('Does not carry the readonly or optional modifiers of schema properties over to the parsed properties', () => {
        // Unlike the inferred model type, where `required` decides optionality, every property has its facets: the facets record drops the schema literal's
        // `readonly` and `?`.
        // See AGENTS.md › A homomorphic mapped type over a schema object copies the schema literal's modifiers.
        type Properties = JSONSchemaModelFragmentFacet<_Schema, undefined, { type: 'object'; properties: { readonly a?: { type: 'null' } } }>['properties'];
        expect(true satisfies AssertTypeEquality<keyof Properties, 'a'>).toBe(true);
        expect(true satisfies AssertTypeEquality<{ -readonly [K in keyof Properties]-?: Properties[K] }, Properties>).toBe(true);
      });

      it('Gets the names of the required properties of a model, leaving out names the model does not define', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person.required).toEqual(['name', 'age']);
        expect(true satisfies AssertTypeEquality<typeof person.required, Array<'name' | 'age'>>).toBe(true);
      });

      it('Gets no required properties of a model with no required keyword', () => {
        const collection = new JSONSchemaCollectionFragmentFacet({ $defs: { A: { type: 'object', properties: { a: { type: 'string' } } } } } as const);
        const a = collection.$defs.A[0];
        expect(a.required).toEqual([]);
        expect(true satisfies AssertTypeEquality<typeof a.required, never[]>).toBe(true);
      });

      it('Parses the validation keywords of an object', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect([person.minProperties, person.maxProperties]).toEqual([2, undefined]);
        expect(true satisfies AssertTypeEquality<typeof person.minProperties, 2>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof person.maxProperties, undefined>).toBe(true);
      });

      it('Infers the type of a model', () => {
        const _assessment = new JSONSchemaCollectionFragmentFacet(jsonSchema).$defs.Assessment[0];
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
