import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaNotTypeFragmentReflect, JSONSchemaNullTypeFragmentReflect } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Something: { not: { type: 'null' } } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Not Type fragment', () => {
      it('Detects a not-type', () => {
        expect(JSONSchemaNotTypeFragmentReflect.is({ not: { type: 'null' } })).toBe(true);
        expect(JSONSchemaNotTypeFragmentReflect.is({ not: {} })).toBe(true);
      });

      it('Rejects a non-not-type, including a boolean schema not', () => {
        expect(JSONSchemaNotTypeFragmentReflect.is({ type: 'null' })).toBe(false);
        expect(JSONSchemaNotTypeFragmentReflect.is({ not: true } as any)).toBe(false);
        expect(JSONSchemaNotTypeFragmentReflect.is({ not: [] } as any)).toBe(false);
      });

      it('Reflects the fragment of a not-type', () => {
        const something = new JSONSchemaCollectionFragmentReflect(_schema).$defs.Something[0];
        expect(something).toBeInstanceOf(JSONSchemaNotTypeFragmentReflect);
        expect(something.not[0]).toBeInstanceOf(JSONSchemaNullTypeFragmentReflect);
        expect(
          true satisfies AssertTypeEquality<typeof something.not, Array<JSONSchemaNullTypeFragmentReflect<_Schema, undefined, { readonly type: 'null' }>>>,
        ).toBe(true);
      });

      it('Infers no constraint from a not-type, as it is not supported yet', () => {
        const _something = new JSONSchemaCollectionFragmentReflect(_schema).$defs.Something[0];
        expect(true satisfies AssertTypeEquality<typeof _something.Type, unknown>).toBe(true);
      });
    });
  });
});
