import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaArrayTypeFragmentFacet, JSONSchemaCollectionFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Names: { type: 'array', items: { type: 'string' }, minItems: 1, uniqueItems: true, format: 'csv' },
    Anything: { type: 'array' },
    Booleans: { type: 'array', items: true },
    Tuple: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  // Runtime tests of ArrayTypeFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/ArrayTypeFragment.test-d.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Array Type fragment', () => {
      // JSONSchemaArrayTypeFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsArrayType), the facets of its `items` (parsed on construction), the
      // validation keywords of arrays (and `format`, applying to values of any type) it parses, and the type-only `Type`. Facets are taken from a JSONSchemaCollectionFragmentFacet parsing the small inline collection above, which covers a single
      // schema, absent, boolean schema and tuple `items`. Each runtime `expect` on a parsed value is paired with an AssertTypeEquality on its static type.
      it('Detects an array type', () => {
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'array' })).toBe(true);
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'array', items: { type: 'string' } })).toBe(true);
      });

      it('Rejects a non-array type', () => {
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'object' })).toBe(false);
        expect(JSONSchemaArrayTypeFragmentFacet.is({ items: { type: 'string' } })).toBe(false);
      });

      it('Parses the items of an array type', () => {
        // `items` is a nested fragment, parsed with no name: hence `undefined` as its facets' name type.
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
        // Boolean schemas and tuples parse as no facets, while an absent `items` is `undefined` (above).
        // See AGENTS.md › Fragment facet types follow the type layer's limits, not the runtime's leniency.
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(collection.$defs.Booleans[0].items).toEqual([]);
        expect(collection.$defs.Tuple[0].items).toEqual([]);
        const _tuple = collection.$defs.Tuple[0];
        expect(true satisfies AssertTypeEquality<typeof _tuple.items, never[]>).toBe(true);
      });

      it('Parses the validation keywords of an array', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const names = collection.$defs.Names[0];
        expect([names.minItems, names.maxItems, names.uniqueItems]).toEqual([1, undefined, true]);
        expect(true satisfies AssertTypeEquality<typeof names.minItems, 1>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof names.maxItems, undefined>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof names.uniqueItems, true>).toBe(true);
        expect(names.format).toBe('csv');
        expect(true satisfies AssertTypeEquality<typeof names.format, 'csv'>).toBe(true);
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
