import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaAllOfTypeFragment, JSONSchemaAllOfTypeFragmentType, JSONSchemaFragmentIsAllOfType, JSONSchemaFragmentType } from './index.js';

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } }; readonly required: readonly ['a'] };
/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelB = { readonly type: 'object'; readonly properties: { readonly b: { readonly type: 'string' } }; readonly required: readonly ['b'] };

describe('JSONSchema', () => {
  // Type layer tests of AllOfTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/AllOfTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('AllOf fragment', () => {
      // JSONSchemaAllOfTypeFragment / JSONSchemaFragmentIsAllOfType and the value type JSONSchemaAllOfTypeFragmentType, the intersection of the members' types.
      // Tested at type level only, on inline `as const` fragments and the small models above, through both JSONSchemaAllOfTypeFragmentType and
      // JSONSchemaFragmentType, by AssertTypeEquality and AssertTypeAssignable.
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
        // Compared by assignability both ways: the inferred type is the intersection of the two model types, which AssertTypeEquality does not consider equal
        // to the single object type it is equivalent to.
        type AllOfModels = JSONSchemaFragmentType<{ readonly allOf: readonly [_ModelA, _ModelB] }>;
        expect(true satisfies AssertTypeAssignable<AllOfModels, { a: number; b: string }>).toBe(true);
        expect(true satisfies AssertTypeAssignable<{ a: number; b: string }, AllOfModels>).toBe(true);
      });

      it('Infers never from conflicting types', () => {
        // Conflicting members are unsatisfiable, which is what `never` is reserved for.
        // See AGENTS.md › JSON schema type inference uses `unknown` for "no constraint".
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
        // An empty `allOf` constrains nothing, so it infers `unknown`, unlike an empty `anyOf` / `oneOf`, which no value satisfies.
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly allOf: readonly [] }>, unknown>).toBe(true);
      });

      it('Infers the element type from a non-tuple all-of-types', () => {
        // A plain array has no head / rest to recurse over, so it is handled on its own rather than falling through to `never`.
        // See AGENTS.md › Recurse over tuples with `T extends readonly [infer H, ...infer R]`.
        expect(true satisfies AssertTypeEquality<JSONSchemaAllOfTypeFragmentType<{ allOf: Array<{ type: 'string' }> }>, string>).toBe(true);
      });

      it('Infers unknown from a non-all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAllOfTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });
  });
});
