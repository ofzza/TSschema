import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsNullType, JSONSchemaFragmentType, JSONSchemaNullTypeFragment, JSONSchemaNullTypeFragmentType } from './index.js';

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('Null Type fragment', () => {
      it('Detects a null type', () => {
        const _nullTypeFragment = { type: 'null' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNullType<typeof _nullTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _nullTypeFragment, JSONSchemaNullTypeFragment>).toBe(true);
      });

      it('Rejects a non-null type', () => {
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
