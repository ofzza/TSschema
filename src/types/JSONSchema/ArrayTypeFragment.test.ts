import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaArrayTypeFragment, JSONSchemaArrayTypeFragmentType, JSONSchemaFragmentIsArrayType, JSONSchemaFragmentType } from './index.js';

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('Array Type fragment', () => {
      it('Detects an array type', () => {
        const _arrayTypeFragment = { type: 'array' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<typeof _arrayTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _arrayTypeFragment, JSONSchemaArrayTypeFragment>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentIsArrayType<{ readonly type: 'array'; readonly items: readonly [{ readonly type: 'string' }] }>,
            true
          >,
        ).toBe(true);
      });

      it('Rejects a non-array type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<{ items: { type: 'string' } }>, false>).toBe(true);
      });

      it('Infers an array type', () => {
        const _arrayTypeFragment = { type: 'array' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayTypeFragment>, Array<unknown>>).toBe(true);
        const _arrayStringTypeFragment = { type: 'array', items: { type: 'string' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayStringTypeFragment>, Array<string>>).toBe(true);
        const _arrayBooleanTypeFragment = { type: 'array', items: { type: 'boolean' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayBooleanTypeFragment>, Array<boolean>>).toBe(true);
        const _arrayNumberTypeFragment = { type: 'array', items: { type: 'number' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayNumberTypeFragment>, Array<number>>).toBe(true);
        const _arrayIntegerTypeFragment = { type: 'array', items: { type: 'integer' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayIntegerTypeFragment>, Array<number>>).toBe(true);
        const _arrayNullTypeFragment = { type: 'array', items: { type: 'null' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayNullTypeFragment>, Array<null>>).toBe(true);
        const _arrayModelTypeFragment = { type: 'array', items: { type: 'object', properties: { a: { type: 'number' } } } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayModelTypeFragment>, Array<{ a: number }>>).toBe(true);
      });

      it('Infers an array of unknown when items are not a single schema', () => {
        const _arrayTupleTypeFragment = { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _arrayTupleTypeFragment>, Array<unknown>>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'array'; readonly items: true }>, Array<unknown>>).toBe(true);
      });

      it('Infers unknown from a non-array type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });
  });
});
