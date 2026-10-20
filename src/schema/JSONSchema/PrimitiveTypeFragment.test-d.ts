import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type {
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaFragmentType,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaPrimitiveTypeFragmentType,
} from './index.js';

describe('JSONSchema', () => {
  // Type layer tests of PrimitiveTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/PrimitiveTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Primitive Type fragment', () => {
      // JSONSchemaPrimitiveTypeFragment / JSONSchemaFragmentIsPrimitiveType and the value type JSONSchemaPrimitiveTypeFragmentType, for a single primitive type
      // name or an array of them, plus what JSONSchemaFragmentType infers from those arrays. Tested at type level only, on inline `as const` fragments, by
      // AssertTypeEquality and AssertTypeAssignable.
      it('Detects a primitive type', () => {
        const _primitiveTypeFragment = { type: 'number' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<typeof _primitiveTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _primitiveTypeFragment, JSONSchemaPrimitiveTypeFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'boolean'] }>, true>).toBe(true);
      });

      it('Rejects a non-primitive type', () => {
        // A type array naming any non primitive type, `null` included, is not a primitive type fragment: JSONSchemaFragmentType splits it into branches before
        // matching any fragment type.
        // See AGENTS.md › A `type` array naming `object`, `array` and / or `null` is split into a union of branches.
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'array' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'object'] }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'null' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'null'] }>, false>).toBe(true);
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
      });

      it('Infers a union of primitive types from an array of type names', () => {
        const _stringOrBooleanTypeFragment = { type: ['string', 'boolean'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _stringOrBooleanTypeFragment>, string | boolean>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _stringOrBooleanTypeFragment>, string | boolean>).toBe(true);
        const _numberOrBooleanTypeFragment = { type: ['integer', 'boolean'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _numberOrBooleanTypeFragment>, number | boolean>).toBe(true);
      });

      it('Infers unknown from an array of type names including non-primitive types, left to the fragment type to split into branches', () => {
        const _stringOrObjectTypeFragment = { type: ['string', 'object'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _stringOrObjectTypeFragment>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _stringOrObjectTypeFragment>, string | object>).toBe(true);
        const _nullableStringTypeFragment = { type: ['string', 'null'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _nullableStringTypeFragment>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _nullableStringTypeFragment>, string | null>).toBe(true);
      });

      it('Infers unknown from a non-primitive type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ type: 'array' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ type: 'null' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ const: 1 }>, unknown>).toBe(true);
      });
    });
  });
});
