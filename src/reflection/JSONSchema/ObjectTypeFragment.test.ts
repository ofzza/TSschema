import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaObjectTypeFragmentFacet } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Anything: { type: 'object' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Object Type fragment', () => {
      it('Detects an object type', () => {
        expect(JSONSchemaObjectTypeFragmentFacet.is({ type: 'object' })).toBe(true);
      });

      it('Rejects a non-object type, or a model', () => {
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
