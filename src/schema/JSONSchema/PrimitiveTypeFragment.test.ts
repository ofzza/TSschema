import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type {
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaFragmentType,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaPrimitiveTypeFragmentType,
} from './index.js';

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('Primitive Type fragment', () => {
      it('Detects a primitive type', () => {
        const _primitiveTypeFragment = { type: 'number' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<typeof _primitiveTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _primitiveTypeFragment, JSONSchemaPrimitiveTypeFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'null'] }>, true>).toBe(true);
      });

      it('Rejects a non-primitive type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'array' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'object'] }>, false>).toBe(true);
      });

      it('Infers a primitive type', () => {
        const _primitiveStringTypeFragment = { type: 'string' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveStringTypeFragment>, string>).toBe(true);
        const _primitiveBooleanTypeFragment = { type: 'boolean' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveBooleanTypeFragment>, boolean>).toBe(true);
        const _primitiveNumberTypeFragment = { type: 'number' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveNumberTypeFragment>, number>).toBe(true);
        const _primitiveIntegerTypeFragment = { type: 'integer' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveIntegerTypeFragment>, number>).toBe(true);
        const _primitiveNullTypeFragment = { type: 'null' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveNullTypeFragment>, null>).toBe(true);
      });

      it('Infers a union of primitive types from an array of type names', () => {
        const _nullableStringTypeFragment = { type: ['string', 'null'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _nullableStringTypeFragment>, string | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _nullableStringTypeFragment>, string | null>).toBe(true);
        const _numberOrBooleanTypeFragment = { type: ['integer', 'boolean'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _numberOrBooleanTypeFragment>, number | boolean>).toBe(true);
      });

      it('Infers unknown from an array of type names including non-primitive types', () => {
        const _stringOrObjectTypeFragment = { type: ['string', 'object'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _stringOrObjectTypeFragment>, unknown>).toBe(true);
      });

      it('Infers unknown from a non-primitive type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ type: 'array' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ const: 1 }>, unknown>).toBe(true);
      });
    });
  });
});
