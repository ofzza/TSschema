import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaObjectTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Anything: { type: 'object' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  // Runtime tests of ObjectTypeFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/ObjectTypeFragment.test.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Object Type fragment', () => {
      // JSONSchemaObjectTypeFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsObjectType), the `type` it parses and the type-only `Type`. Facets
      // are taken from a JSONSchemaCollectionFragmentFacet parsing the small inline collection above. Each runtime `expect` on a parsed value is paired with an
      // AssertTypeEquality on its static type.
      it('Detects an object type', () => {
        expect(JSONSchemaObjectTypeFragmentFacet.is({ type: 'object' })).toBe(true);
      });

      it('Rejects a non-object type, or a model', () => {
        // A `type: 'object'` fragment with `properties` is a model, parsed by JSONSchemaModelFragmentFacet instead, so the two facets never both match one
        // fragment.
        expect(JSONSchemaObjectTypeFragmentFacet.is({ type: 'array' })).toBe(false);
        expect(JSONSchemaObjectTypeFragmentFacet.is({ type: 'object', properties: {} })).toBe(false);
      });

      it('Parses an object type', () => {
        const anything = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Anything[0];
        expect(anything).toBeInstanceOf(JSONSchemaObjectTypeFragmentFacet);
        expect(anything.type).toBe('object');
        expect(true satisfies AssertTypeEquality<typeof anything, JSONSchemaObjectTypeFragmentFacet<_Schema, 'Anything', _Schema['$defs']['Anything']>>).toBe(
          true,
        );
      });

      it('Infers the type of an object type', () => {
        const _anything = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Anything[0];
        expect(true satisfies AssertTypeEquality<typeof _anything.Type, object>).toBe(true);
      });
    });
  });
});
