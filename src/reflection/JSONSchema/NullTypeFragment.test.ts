import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaNullTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Nothing: { type: 'null' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Null Type fragment', () => {
      it('Detects a null type', () => {
        expect(JSONSchemaNullTypeFragmentFacet.is({ type: 'null' })).toBe(true);
      });

      it('Rejects a non-null type', () => {
        expect(JSONSchemaNullTypeFragmentFacet.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaNullTypeFragmentFacet.is({ const: null })).toBe(false);
        // A type array naming null is split into branches by the router, before any facet type checks it
        expect(JSONSchemaNullTypeFragmentFacet.is({ type: ['null'] })).toBe(false);
      });

      it('Parses a null type', () => {
        const nothing = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Nothing[0];
        expect(nothing).toBeInstanceOf(JSONSchemaNullTypeFragmentFacet);
        expect(nothing.type).toBe('null');
        expect(true satisfies AssertTypeEquality<typeof nothing, JSONSchemaNullTypeFragmentFacet<_Schema, 'Nothing', _Schema['$defs']['Nothing']>>).toBe(true);
      });

      it('Infers the type of a null type', () => {
        const _nothing = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Nothing[0];
        expect(true satisfies AssertTypeEquality<typeof _nothing.Type, null>).toBe(true);
      });
    });
  });
});
