import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaNullTypeFragmentReflect } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Nothing: { type: 'null' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Null Type fragment', () => {
      it('Detects a null type', () => {
        expect(JSONSchemaNullTypeFragmentReflect.is({ type: 'null' })).toBe(true);
      });

      it('Rejects a non-null type', () => {
        expect(JSONSchemaNullTypeFragmentReflect.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaNullTypeFragmentReflect.is({ const: null })).toBe(false);
        // A type array naming null is split into branches by the router, before any reflection type checks it
        expect(JSONSchemaNullTypeFragmentReflect.is({ type: ['null'] })).toBe(false);
      });

      it('Reflects a null type', () => {
        const nothing = new JSONSchemaCollectionFragmentReflect(_schema).$defs.Nothing[0];
        expect(nothing).toBeInstanceOf(JSONSchemaNullTypeFragmentReflect);
        expect(nothing.type).toBe('null');
        expect(true satisfies AssertTypeEquality<typeof nothing, JSONSchemaNullTypeFragmentReflect<_Schema, 'Nothing', _Schema['$defs']['Nothing']>>).toBe(
          true,
        );
      });

      it('Infers the type of a null type', () => {
        const _nothing = new JSONSchemaCollectionFragmentReflect(_schema).$defs.Nothing[0];
        expect(true satisfies AssertTypeEquality<typeof _nothing.Type, null>).toBe(true);
      });
    });
  });
});
