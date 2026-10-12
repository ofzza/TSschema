import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection } from '../../schema/JSONSchema/index.js';
import { JSONSchemaAllOfTypeFragmentNode, JSONSchemaCollectionFragmentNode, JSONSchemaModelFragmentNode, JSONSchemaReferenceFragmentNode } from './index.js';

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
  describe('JSONSchema fragment nodes', () => {
    describe('AllOf Type fragment', () => {
      it('Detects an all-of-types', () => {
        expect(JSONSchemaAllOfTypeFragmentNode.is({ allOf: [{ type: 'string' }] })).toBe(true);
        expect(JSONSchemaAllOfTypeFragmentNode.is({ allOf: [] })).toBe(true);
      });

      it('Rejects a non-all-of-types', () => {
        expect(JSONSchemaAllOfTypeFragmentNode.is({ anyOf: [{ type: 'string' }] })).toBe(false);
        expect(JSONSchemaAllOfTypeFragmentNode.is({ allOf: { type: 'string' } } as any)).toBe(false);
      });

      it('Parses each fragment of an all-of-types, in order', () => {
        const person = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0];
        expect(person).toBeInstanceOf(JSONSchemaAllOfTypeFragmentNode);
        expect(person.allOf.length).toBe(2);
        expect(person.allOf[0][0]).toBeInstanceOf(JSONSchemaReferenceFragmentNode);
        expect(person.allOf[1][0]).toBeInstanceOf(JSONSchemaModelFragmentNode);
        expect(person.allOf[1][0].names).toEqual(['age']);
        expect(
          true satisfies AssertTypeEquality<
            typeof person.allOf,
            [
              Array<JSONSchemaReferenceFragmentNode<_Schema, undefined, _Person['allOf'][0]>>,
              Array<JSONSchemaModelFragmentNode<_Schema, undefined, _Person['allOf'][1]>>,
            ]
          >,
        ).toBe(true);
      });

      it('Parses a member of an all-of-types which is not a schema object with no nodes', () => {
        // TODO: `JSONSchemaAllOfTypeFragment` requires every member to be a schema object, so boolean schemas (valid JSON schema) are not yet supported by
        //       the types; at runtime they are parsed with no nodes
        const collection = new JSONSchemaCollectionFragmentNode({ $defs: { A: { allOf: [{ type: 'string' }, true] } } } as JSONSchemaCollection);
        const a = collection.$defs.A[0];
        expect(a instanceof JSONSchemaAllOfTypeFragmentNode && a.allOf.map((member) => member.length)).toEqual([1, 0]);
      });

      it('Infers the type of an all-of-types', () => {
        const _person = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0];
        type Person = typeof _person.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Person['name'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Person['age'], number>).toBe(true);
      });
    });
  });
});
