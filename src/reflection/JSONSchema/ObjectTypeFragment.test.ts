import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaObjectTypeFragmentReflect } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Anything: { type: 'object' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Object Type fragment', () => {
      it('Detects an object type', () => {
        expect(JSONSchemaObjectTypeFragmentReflect.check({ type: 'object' })).toBe(true);
      });

      it('Rejects a non-object type, or a model', () => {
        expect(JSONSchemaObjectTypeFragmentReflect.check({ type: 'array' })).toBe(false);
        expect(JSONSchemaObjectTypeFragmentReflect.check({ type: 'object', properties: {} })).toBe(false);
      });

      it('Reflects an object type', () => {
        const anything = new JSONSchemaCollectionFragmentReflect(_schema).$defs.Anything[0];
        expect(anything).toBeInstanceOf(JSONSchemaObjectTypeFragmentReflect);
        expect(anything.type).toBe('object');
        expect(true satisfies AssertTypeEquality<typeof anything, JSONSchemaObjectTypeFragmentReflect<_Schema, 'Anything', _Schema['$defs']['Anything']>>).toBe(
          true,
        );
      });

      it('Infers the type of an object type', () => {
        const _anything = new JSONSchemaCollectionFragmentReflect(_schema).$defs.Anything[0];
        expect(true satisfies AssertTypeEquality<typeof _anything.Type, object>).toBe(true);
      });
    });
  });
});
