import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaAllOfTypeFragmentFacet,
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
} from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Named: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    Person: { allOf: [{ $ref: '#/$defs/Named' }, { type: 'object', properties: { age: { type: 'integer' } }, required: ['age'] }] },
  },
} as const;
type _Schema = typeof _schema;
type _Person = _Schema['$defs']['Person'];

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('AllOf Type fragment', () => {
      it('Detects an all-of-types', () => {
        expect(JSONSchemaAllOfTypeFragmentFacet.is({ allOf: [{ type: 'string' }] })).toBe(true);
        expect(JSONSchemaAllOfTypeFragmentFacet.is({ allOf: [] })).toBe(true);
      });

      it('Rejects a non-all-of-types', () => {
        expect(JSONSchemaAllOfTypeFragmentFacet.is({ anyOf: [{ type: 'string' }] })).toBe(false);
        expect(JSONSchemaAllOfTypeFragmentFacet.is({ allOf: { type: 'string' } } as any)).toBe(false);
      });

      it('Parses each fragment of an all-of-types, in order', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person).toBeInstanceOf(JSONSchemaAllOfTypeFragmentFacet);
        expect(person.allOf.length).toBe(2);
        expect(person.allOf[0][0]).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(person.allOf[1][0]).toBeInstanceOf(JSONSchemaModelFragmentFacet);
        expect(person.allOf[1][0].names).toEqual(['age']);
        expect(
          true satisfies AssertTypeEquality<
            typeof person.allOf,
            [
              Array<JSONSchemaReferenceFragmentFacet<_Schema, undefined, _Person['allOf'][0]>>,
              Array<JSONSchemaModelFragmentFacet<_Schema, undefined, _Person['allOf'][1]>>,
            ]
          >,
        ).toBe(true);
      });

      it('Parses a member of an all-of-types which is not a schema object with no facets', () => {
        // TODO: `JSONSchemaAllOfTypeFragment` requires every member to be a schema object, so boolean schemas (valid JSON schema) are not yet supported by
        //       the types; at runtime they are parsed with no facets
        const collection = new JSONSchemaCollectionFragmentFacet({ $defs: { A: { allOf: [{ type: 'string' }, true] } } } as JSONSchemaCollection);
        const a = collection.$defs.A[0];
        expect(a instanceof JSONSchemaAllOfTypeFragmentFacet && a.allOf.map((member) => member.length)).toEqual([1, 0]);
      });

      it('Infers the type of an all-of-types', () => {
        const _person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        type Person = typeof _person.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Person['name'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Person['age'], number>).toBe(true);
      });
    });
  });
});
