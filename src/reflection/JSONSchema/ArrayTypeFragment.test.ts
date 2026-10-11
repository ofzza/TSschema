import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaArrayTypeFragmentReflect, JSONSchemaCollectionFragmentReflect, JSONSchemaPrimitiveTypeFragmentReflect } from './index.js';

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
  describe('JSONSchema fragment reflections', () => {
    describe('Array Type fragment', () => {
      it('Detects an array type', () => {
        expect(JSONSchemaArrayTypeFragmentReflect.check({ type: 'array' })).toBe(true);
        expect(JSONSchemaArrayTypeFragmentReflect.check({ type: 'array', items: { type: 'string' } })).toBe(true);
      });

      it('Rejects a non-array type', () => {
        expect(JSONSchemaArrayTypeFragmentReflect.check({ type: 'object' })).toBe(false);
        expect(JSONSchemaArrayTypeFragmentReflect.check({ items: { type: 'string' } })).toBe(false);
      });

      it('Reflects the items of an array type', () => {
        const names = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Names')[0];
        expect(names).toBeInstanceOf(JSONSchemaArrayTypeFragmentReflect);
        expect(names.type).toBe('array');
        expect(names.items.length).toBe(1);
        expect(names.items[0]).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentReflect);
        expect(names.items[0].type).toBe('string');
        expect(
          true satisfies AssertTypeEquality<typeof names.items, Array<JSONSchemaPrimitiveTypeFragmentReflect<_Schema, undefined, { readonly type: 'string' }>>>,
        ).toBe(true);
      });

      it('Reflects no items of an array type with no items', () => {
        const anything = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Anything')[0];
        expect(anything.items).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof anything.items, undefined>).toBe(true);
      });

      it('Reflects items which are not a single schema object with no reflections', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        expect(collection.fragment('Booleans')[0].items).toEqual([]);
        expect(collection.fragment('Tuple')[0].items).toEqual([]);
        const _tuple = collection.fragment('Tuple')[0];
        expect(true satisfies AssertTypeEquality<typeof _tuple.items, never[]>).toBe(true);
      });

      it('Infers the type of an array type', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const _names = collection.fragment('Names')[0];
        expect(true satisfies AssertTypeEquality<typeof _names.Type, string[]>).toBe(true);
        const _anything = collection.fragment('Anything')[0];
        expect(true satisfies AssertTypeEquality<typeof _anything.Type, unknown[]>).toBe(true);
      });
    });
  });
});
