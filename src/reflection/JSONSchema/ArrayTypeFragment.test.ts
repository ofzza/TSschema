import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaArrayTypeFragmentFacet, JSONSchemaCollectionFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Names: { type: 'array', items: { type: 'string' } },
    Anything: { type: 'array' },
    Booleans: { type: 'array', items: true },
    Tuple: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Array Type fragment', () => {
      it('Detects an array type', () => {
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'array' })).toBe(true);
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'array', items: { type: 'string' } })).toBe(true);
      });

      it('Rejects a non-array type', () => {
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'object' })).toBe(false);
        expect(JSONSchemaArrayTypeFragmentFacet.is({ items: { type: 'string' } })).toBe(false);
      });

      it('Parses the items of an array type', () => {
        const names = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Names[0];
        expect(names).toBeInstanceOf(JSONSchemaArrayTypeFragmentFacet);
        expect(names.type).toBe('array');
        expect(names.items.length).toBe(1);
        expect(names.items[0]).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
        expect(names.items[0].type).toBe('string');
        expect(
          true satisfies AssertTypeEquality<typeof names.items, Array<JSONSchemaPrimitiveTypeFragmentFacet<_Schema, undefined, { readonly type: 'string' }>>>,
        ).toBe(true);
      });

      it('Parses no items of an array type with no items', () => {
        const anything = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Anything[0];
        expect(anything.items).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof anything.items, undefined>).toBe(true);
      });

      it('Parses items which are not a single schema object with no facets', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(collection.$defs.Booleans[0].items).toEqual([]);
        expect(collection.$defs.Tuple[0].items).toEqual([]);
        const _tuple = collection.$defs.Tuple[0];
        expect(true satisfies AssertTypeEquality<typeof _tuple.items, never[]>).toBe(true);
      });

      it('Infers the type of an array type', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const _names = collection.$defs.Names[0];
        expect(true satisfies AssertTypeEquality<typeof _names.Type, string[]>).toBe(true);
        const _anything = collection.$defs.Anything[0];
        expect(true satisfies AssertTypeEquality<typeof _anything.Type, unknown[]>).toBe(true);
      });
    });
  });
});
