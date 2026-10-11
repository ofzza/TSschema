import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaPrimitiveTypeFragmentReflect } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: { Text: { type: 'string', format: 'email' }, Count: { type: 'integer' }, Scalar: { type: ['string', 'number', 'boolean'] } },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Primitive Type fragment', () => {
      it('Detects a primitive type', () => {
        expect(['string', 'number', 'integer', 'boolean'].every((type) => JSONSchemaPrimitiveTypeFragmentReflect.check({ type } as any))).toBe(true);
        expect(JSONSchemaPrimitiveTypeFragmentReflect.check({ type: ['string', 'number'] })).toBe(true);
      });

      it('Rejects a non-primitive type, including null', () => {
        expect(JSONSchemaPrimitiveTypeFragmentReflect.check({ type: 'null' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentReflect.check({ type: 'object' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentReflect.check({ type: 'array' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentReflect.check({ type: ['string', 'null'] })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentReflect.check({ enum: ['a'] })).toBe(false);
      });

      it('Reflects the type of a primitive type', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const text = collection.fragment('Text')[0];
        expect(text).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentReflect);
        expect(text.type).toBe('string');
        expect(true satisfies AssertTypeEquality<typeof text.type, 'string'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof text, JSONSchemaPrimitiveTypeFragmentReflect<_Schema, 'Text', _Schema['$defs']['Text']>>).toBe(true);
      });

      it('Reflects the types of an array of primitive types', () => {
        const scalar = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Scalar')[0];
        expect(scalar.type).toEqual(['string', 'number', 'boolean']);
        expect(true satisfies AssertTypeEquality<typeof scalar.type, readonly ['string', 'number', 'boolean']>).toBe(true);
      });

      it('Infers the type of a primitive type', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const _count = collection.fragment('Count')[0];
        expect(true satisfies AssertTypeEquality<typeof _count.Type, number>).toBe(true);
        const _scalar = collection.fragment('Scalar')[0];
        expect(true satisfies AssertTypeEquality<typeof _scalar.Type, string | number | boolean>).toBe(true);
      });
    });
  });
});
