import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaNotTypeFragmentFacet, JSONSchemaNullTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Something: { not: { type: 'null' } } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  // Runtime tests of NotTypeFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/NotTypeFragment.test.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Not Type fragment', () => {
      // JSONSchemaNotTypeFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsNotType), the facets of its `not` fragment (parsed on construction)
      // and the type-only `Type`, which places no constraint as the type layer does not support `not` yet. Facets are taken from a
      // JSONSchemaCollectionFragmentFacet parsing the small inline collection above. Each runtime `expect` on a parsed value is paired with an
      // AssertTypeEquality on its static type.
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
