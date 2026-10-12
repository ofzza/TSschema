import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaNotTypeFragmentFacet, JSONSchemaNullTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Something: { not: { type: 'null' } } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Not Type fragment', () => {
      it('Detects a not-type', () => {
        expect(JSONSchemaNotTypeFragmentFacet.is({ not: { type: 'null' } })).toBe(true);
        expect(JSONSchemaNotTypeFragmentFacet.is({ not: {} })).toBe(true);
      });

      it('Rejects a non-not-type, including a boolean schema not', () => {
        expect(JSONSchemaNotTypeFragmentFacet.is({ type: 'null' })).toBe(false);
        expect(JSONSchemaNotTypeFragmentFacet.is({ not: true } as any)).toBe(false);
        expect(JSONSchemaNotTypeFragmentFacet.is({ not: [] } as any)).toBe(false);
      });

      it('Parses the fragment of a not-type', () => {
        const something = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Something[0];
        expect(something).toBeInstanceOf(JSONSchemaNotTypeFragmentFacet);
        expect(something.not[0]).toBeInstanceOf(JSONSchemaNullTypeFragmentFacet);
        expect(
          true satisfies AssertTypeEquality<typeof something.not, Array<JSONSchemaNullTypeFragmentFacet<_Schema, undefined, { readonly type: 'null' }>>>,
        ).toBe(true);
      });

      it('Infers no constraint from a not-type, as it is not supported yet', () => {
        const _something = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Something[0];
        expect(true satisfies AssertTypeEquality<typeof _something.Type, unknown>).toBe(true);
      });
    });
  });
});
