import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaArrayTypeFragment, JSONSchemaArrayTypeFragmentType, JSONSchemaFragmentIsArrayType, JSONSchemaFragmentType } from './index.js';

describe('JSONSchema', () => {
  // Type layer tests of ArrayTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/ArrayTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Array Type fragment', () => {
      // JSONSchemaArrayTypeFragment / JSONSchemaFragmentIsArrayType and the value type JSONSchemaArrayTypeFragmentType, an Array of the type inferred from a
      // single schema `items`. Tested at type level only, on inline `as const` fragments with `items` of every primitive type, `null` and a model, by
      // AssertTypeEquality and AssertTypeAssignable.
      it('Detects an array type', () => {
        // The tuple `items` case guards the check against drifting from the fragment type that JSONSchemaFragmentType dispatches on.
        // See AGENTS.md › Define every `JSONSchemaFragmentIs*<T>` as `T extends JSONSchema*Fragment ? true : false`.
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
        // `items` alone, with no `type: 'array'`, does not make an array type fragment.
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
        const _arrayModelTypeFragment = { type: 'array', items: { type: 'object', properties: { a: { type: 'number' } }, required: ['a'] } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayModelTypeFragment>, Array<{ a: number }>>).toBe(true);
      });

      it('Infers an array of unknown when items are not a single schema', () => {
        // Tuple `items` are not supported yet, and a boolean schema `items` gives no type to infer, so both infer the unconstrained `Array<unknown>`.
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
