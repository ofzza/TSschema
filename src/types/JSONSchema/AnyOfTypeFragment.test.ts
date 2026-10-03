import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaAnyOfTypeFragment, JSONSchemaAnyOfTypeFragmentType, JSONSchemaFragmentIsAnyOfType, JSONSchemaFragmentType } from './index.js';

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } } };

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('AnyOf fragment', () => {
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
