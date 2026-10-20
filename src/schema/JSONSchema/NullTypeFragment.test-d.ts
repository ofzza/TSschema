import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsNullType, JSONSchemaFragmentType, JSONSchemaNullTypeFragment, JSONSchemaNullTypeFragmentType } from './index.js';

describe('JSONSchema', () => {
  // Type layer tests of NullTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/NullTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Null Type fragment', () => {
      // JSONSchemaNullTypeFragment / JSONSchemaFragmentIsNullType and the value type JSONSchemaNullTypeFragmentType, plus how JSONSchemaFragmentType infers
      // `null` from single types and type arrays. Tested at type level only, on inline `as const` fragments, by
      // AssertTypeEquality and AssertTypeAssignable.
      it('Detects a null type', () => {
        const _nullTypeFragment = { type: 'null' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNullType<typeof _nullTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _nullTypeFragment, JSONSchemaNullTypeFragment>).toBe(true);
      });

      it('Rejects a non-null type', () => {
        // A type array naming `null` is split into branches before any fragment type is matched, so the null type fragment only ever matches a single `type:
        // 'null'`.
        // See AGENTS.md › A `type` array naming `object`, `array` and / or `null` is split into a union of branches.
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNullType<{ type: 'string' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNullType<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNullType<{ readonly type: readonly ['string', 'null'] }>, false>).toBe(true);
      });

      it('Infers a null type', () => {
        const _nullTypeFragment = { type: 'null' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaNullTypeFragmentType<typeof _nullTypeFragment>, null>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _nullTypeFragment>, null>).toBe(true);
      });

      it('Infers null as one of the types of a type array naming null', () => {
        // See AGENTS.md › `null` is not a primitive type: a nullable primitive is split into a primitive and a `null` branch.
        const _nullableStringTypeFragment = { type: ['string', 'null'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _nullableStringTypeFragment>, string | null>).toBe(true);
        const _nullOnlyTypeFragment = { type: ['null'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _nullOnlyTypeFragment>, null>).toBe(true);
      });

      it('Infers unknown from a non-null type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaNullTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaNullTypeFragmentType<{ const: 1 }>, unknown>).toBe(true);
      });
    });
  });
});
