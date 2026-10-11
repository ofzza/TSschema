import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaAllOfTypeFragmentReflect,
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaModelFragmentReflect,
  JSONSchemaReferenceFragmentReflect,
} from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Named: { type: 'object', properties: { name: { type: 'string' } } },
    Person: { allOf: [{ $ref: '#/$defs/Named' }, { type: 'object', properties: { age: { type: 'integer' } } }] },
  },
} as const;
type _Schema = typeof _schema;
type _Person = _Schema['$defs']['Person'];

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('AllOf Type fragment', () => {
      it('Detects an all-of-types', () => {
        expect(JSONSchemaAllOfTypeFragmentReflect.check({ allOf: [{ type: 'string' }] })).toBe(true);
        expect(JSONSchemaAllOfTypeFragmentReflect.check({ allOf: [] })).toBe(true);
      });

      it('Rejects a non-all-of-types', () => {
        expect(JSONSchemaAllOfTypeFragmentReflect.check({ anyOf: [{ type: 'string' }] })).toBe(false);
        expect(JSONSchemaAllOfTypeFragmentReflect.check({ allOf: { type: 'string' } } as any)).toBe(false);
      });

      it('Reflects each fragment of an all-of-types, in order', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person).toBeInstanceOf(JSONSchemaAllOfTypeFragmentReflect);
        expect(person.allOf.length).toBe(2);
        expect(person.allOf[0][0]).toBeInstanceOf(JSONSchemaReferenceFragmentReflect);
        expect(person.allOf[1][0]).toBeInstanceOf(JSONSchemaModelFragmentReflect);
        expect(person.allOf[1][0].names).toEqual(['age']);
        expect(
          true satisfies AssertTypeEquality<
            typeof person.allOf,
            [
              Array<JSONSchemaReferenceFragmentReflect<_Schema, undefined, _Person['allOf'][0]>>,
              Array<JSONSchemaModelFragmentReflect<_Schema, undefined, _Person['allOf'][1]>>,
            ]
          >,
        ).toBe(true);
      });

      it('Reflects a member of an all-of-types which is not a schema object with no reflections', () => {
        // TODO: `JSONSchemaAllOfTypeFragment` requires every member to be a schema object, so boolean schemas (valid JSON schema) are not yet supported by
        //       the types; at runtime they are reflected with no reflections
        const collection = new JSONSchemaCollectionFragmentReflect({ $defs: { A: { allOf: [{ type: 'string' }, true] } } } as JSONSchemaCollection);
        const a = collection.fragment('A')[0];
        expect(a instanceof JSONSchemaAllOfTypeFragmentReflect && a.allOf.map((member) => member.length)).toEqual([1, 0]);
      });

      it('Infers the type of an all-of-types', () => {
        const _person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        type Person = typeof _person.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Person['name'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Person['age'], number>).toBe(true);
      });
    });
  });
});
