import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaAllOfTypeFragment, JSONSchemaAllOfTypeFragmentType, JSONSchemaFragmentIsAllOfType, JSONSchemaFragmentType } from './index.js';

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } } };
/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelB = { readonly type: 'object'; readonly properties: { readonly b: { readonly type: 'string' } } };

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('AllOf fragment', () => {
      it('Detects an all-of-types', () => {
        const _allOfTypeFragment = { allOf: [{ type: 'number' }, { const: 123 }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAllOfType<typeof _allOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _allOfTypeFragment, JSONSchemaAllOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAllOfType<{ anyOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers an all-of-types type', () => {
        const _allOfTypeFragment = { allOf: [{ type: 'number' }, { const: 123 }] } as const;
        type AllOfTypeFragmentType = JSONSchemaAllOfTypeFragmentType<typeof _allOfTypeFragment>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AllOfTypeFragmentType, 123>).toBe(true);
      });

      it('Infers the intersection of models', () => {
        type AllOfModels = JSONSchemaFragmentType<{ readonly allOf: readonly [_ModelA, _ModelB] }>;
        expect(true satisfies AssertTypeAssignable<AllOfModels, { a: number; b: string }>).toBe(true);
        expect(true satisfies AssertTypeAssignable<{ a: number; b: string }, AllOfModels>).toBe(true);
      });

      it('Infers never from conflicting types', () => {
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentType<{ readonly allOf: readonly [{ readonly type: 'string' }, { readonly type: 'number' }] }>,
            never
          >,
        ).toBe(true);
      });

      it('Infers a type from nested combinators', () => {
        type Nested = JSONSchemaFragmentType<{
          readonly allOf: readonly [{ readonly anyOf: readonly [{ readonly type: 'string' }, { readonly type: 'null' }] }, { readonly type: 'string' }];
        }>;
        expect(true satisfies AssertTypeEquality<Nested, string>).toBe(true);
      });

      it('Infers unknown from an empty all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly allOf: readonly [] }>, unknown>).toBe(true);
      });

      it('Infers the element type from a non-tuple all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAllOfTypeFragmentType<{ allOf: Array<{ type: 'string' }> }>, string>).toBe(true);
      });

      it('Infers unknown from a non-all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAllOfTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });
  });
});
