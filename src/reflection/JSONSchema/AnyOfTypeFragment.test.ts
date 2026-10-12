import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaAnyOfTypeFragmentFacet,
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaNullTypeFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
} from './index.js';

import { default as jsonSchema } from '../../../res/sidecar/schema.json';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Named: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    MaybeNamed: { anyOf: [{ $ref: '#/$defs/Named' }, { type: 'null' }] },
    Nullable: { type: ['object', 'null'], properties: { name: { type: 'string' } }, required: ['name'] },
  },
} as const;
type _Schema = typeof _schema;
type _MaybeNamed = _Schema['$defs']['MaybeNamed'];

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('AnyOf Type fragment', () => {
      it('Detects an any-of-types', () => {
        expect(JSONSchemaAnyOfTypeFragmentFacet.is({ anyOf: [{ type: 'string' }] })).toBe(true);
        expect(JSONSchemaAnyOfTypeFragmentFacet.is(jsonSchema.$defs.Assessment.properties.class)).toBe(true);
      });

      it('Rejects a non-any-of-types', () => {
        expect(JSONSchemaAnyOfTypeFragmentFacet.is({ oneOf: [{ type: 'string' }] })).toBe(false);
        expect(JSONSchemaAnyOfTypeFragmentFacet.is({ anyOf: { type: 'string' } } as any)).toBe(false);
      });

      it('Parses each fragment of an any-of-types, in order', () => {
        const maybeNamed = new JSONSchemaCollectionFragmentFacet(_schema).$defs.MaybeNamed[0];
        expect(maybeNamed).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentFacet);
        expect(maybeNamed.implicit).toBe(false);
        expect(maybeNamed.anyOf[0][0]).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(maybeNamed.anyOf[1][0]).toBeInstanceOf(JSONSchemaNullTypeFragmentFacet);
        expect(
          true satisfies AssertTypeEquality<
            typeof maybeNamed.anyOf,
            [
              Array<JSONSchemaReferenceFragmentFacet<_Schema, undefined, _MaybeNamed['anyOf'][0]>>,
              Array<JSONSchemaNullTypeFragmentFacet<_Schema, undefined, _MaybeNamed['anyOf'][1]>>,
            ]
          >,
        ).toBe(true);
      });

      it('Parses the branches of a type array naming several groups of type names as an implicit any-of-types', () => {
        const nullable = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Nullable[0];
        expect(nullable).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentFacet);
        expect(nullable.implicit).toBe(true);
        expect(nullable.fragment).toEqual({
          anyOf: [
            { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
            { type: 'null', properties: { name: { type: 'string' } }, required: ['name'] },
          ],
        });
        const [[model], [nothing]] = nullable.anyOf;
        expect(model).toBeInstanceOf(JSONSchemaModelFragmentFacet);
        expect(nothing).toBeInstanceOf(JSONSchemaNullTypeFragmentFacet);
      });

      it('Parses an any-of-types as explicit unless told it is implicit', () => {
        expect(new JSONSchemaAnyOfTypeFragmentFacet({ anyOf: [{ type: 'string' }] }).implicit).toBe(false);
        expect(new JSONSchemaAnyOfTypeFragmentFacet({ anyOf: [{ type: 'string' }] }, { implicit: true }).implicit).toBe(true);
      });

      it('Infers the type of an any-of-types', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const _maybeNamed = collection.$defs.MaybeNamed[0];
        expect(true satisfies AssertTypeEquality<typeof _maybeNamed.Type, { name: string } | null>).toBe(true);
        const _nullable = collection.$defs.Nullable[0];
        expect(true satisfies AssertTypeEquality<typeof _nullable.Type, { name: string } | null>).toBe(true);
      });
    });
  });
});
