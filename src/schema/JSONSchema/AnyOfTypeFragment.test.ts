import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaAnyOfTypeFragment, JSONSchemaAnyOfTypeFragmentType, JSONSchemaFragmentIsAnyOfType, JSONSchemaFragmentType } from './index.js';

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } }; readonly required: readonly ['a'] };

describe('JSONSchema', () => {
  // Type layer tests of AnyOfTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/AnyOfTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('AnyOf fragment', () => {
      // JSONSchemaAnyOfTypeFragment / JSONSchemaFragmentIsAnyOfType and the value type JSONSchemaAnyOfTypeFragmentType, the union of the members' types. Tested
      // at type level only, on inline `as const` fragments and the small model above, through both JSONSchemaAnyOfTypeFragmentType and JSONSchemaFragmentType,
      // by AssertTypeEquality and AssertTypeAssignable.
      it('Detects an any-of-types', () => {
        const _anyOfTypeFragment = { anyOf: [{ type: 'number' }, { type: 'string' }, { const: true }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAnyOfType<typeof _anyOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _anyOfTypeFragment, JSONSchemaAnyOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAnyOfType<{ allOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers an any-of-types type', () => {
        const _anyOfTypeFragment = { anyOf: [{ type: 'number' }, { type: 'string' }, { const: true }] } as const;
        type AnyOfTypeFragmentType = JSONSchemaAnyOfTypeFragmentType<typeof _anyOfTypeFragment>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AnyOfTypeFragmentType, number | string | true>).toBe(true);
      });

      it('Infers the union of models and other types', () => {
        expect(
          true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly anyOf: readonly [_ModelA, { readonly type: 'null' }] }>, { a: number } | null>,
        ).toBe(true);
      });

      it('Infers never from an empty any-of-types', () => {
        // An empty `anyOf` is satisfied by no value, so unlike an empty `allOf` it infers `never`.
        // See AGENTS.md › JSON schema type inference uses `unknown` for "no constraint".
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly anyOf: readonly [] }>, never>).toBe(true);
      });

      it('Infers the element type from a non-tuple any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAnyOfTypeFragmentType<{ anyOf: Array<{ type: 'string' } | { type: 'null' }> }>, string | null>).toBe(
          true,
        );
      });

      it('Infers unknown from a non-any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAnyOfTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });
  });
});
