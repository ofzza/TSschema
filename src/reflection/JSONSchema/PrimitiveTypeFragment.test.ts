import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: { Text: { type: 'string', format: 'email' }, Count: { type: 'integer' }, Scalar: { type: ['string', 'number', 'boolean'] } },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Primitive Type fragment', () => {
      it('Detects a primitive type', () => {
        expect(['string', 'number', 'integer', 'boolean'].every((type) => JSONSchemaPrimitiveTypeFragmentFacet.is({ type } as any))).toBe(true);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: ['string', 'number'] })).toBe(true);
      });

      it('Rejects a non-primitive type, including null', () => {
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: 'null' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: 'object' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: 'array' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: ['string', 'null'] })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ enum: ['a'] })).toBe(false);
      });

      it('Parses the type of a primitive type', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const text = collection.$defs.Text[0];
        expect(text).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
        expect(text.type).toBe('string');
        expect(true satisfies AssertTypeEquality<typeof text.type, 'string'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof text, JSONSchemaPrimitiveTypeFragmentFacet<_Schema, 'Text', _Schema['$defs']['Text']>>).toBe(true);
      });

      it('Parses the types of an array of primitive types', () => {
        const scalar = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Scalar[0];
        expect(scalar.type).toEqual(['string', 'number', 'boolean']);
        expect(true satisfies AssertTypeEquality<typeof scalar.type, readonly ['string', 'number', 'boolean']>).toBe(true);
      });

      it('Infers the type of a primitive type', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const _count = collection.$defs.Count[0];
        expect(true satisfies AssertTypeEquality<typeof _count.Type, number>).toBe(true);
        const _scalar = collection.$defs.Scalar[0];
        expect(true satisfies AssertTypeEquality<typeof _scalar.Type, string | number | boolean>).toBe(true);
      });
    });
  });
});
