import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsOneOfType, JSONSchemaFragmentType, JSONSchemaOneOfTypeFragment, JSONSchemaOneOfTypeFragmentType } from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } }; readonly required: readonly ['a'] };

describe('JSONSchema', () => {
  // Type layer tests of OneOfTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/OneOfTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('OneOf fragment', () => {
      // JSONSchemaOneOfTypeFragment / JSONSchemaFragmentIsOneOfType and the value type JSONSchemaOneOfTypeFragmentType, which over-approximates `oneOf` as the
      // union of the members' types, as `anyOf` is inferred. Tested at type level only, on inline `as const` fragments and on the AssessmentKind enum of the
      // res/schema.json fixture (a `oneOf` of titled `const`s next to `type: 'integer'`), by AssertTypeEquality and AssertTypeAssignable.
      it('Detects a one-of-types', () => {
        const _oneOfTypeFragment = { oneOf: [{ type: 'number' }, { type: 'string' }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<typeof _oneOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _oneOfTypeFragment, JSONSchemaOneOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-one-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<{ anyOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers a one-of-types type', () => {
        const _oneOfTypeFragment = { oneOf: [{ type: 'number' }, { type: 'string' }] } as const;
        type OneOfTypeFragmentType = JSONSchemaOneOfTypeFragmentType<typeof _oneOfTypeFragment>;
        //   ^?
        expect(true satisfies AssertTypeEquality<OneOfTypeFragmentType, number | string>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _oneOfTypeFragment>, number | string>).toBe(true);
      });

      it('Infers the union of models and other types', () => {
        expect(
          true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly oneOf: readonly [_ModelA, { readonly type: 'null' }] }>, { a: number } | null>,
        ).toBe(true);
      });

      it('Infers a union of tagged models', () => {
        type Shape = JSONSchemaFragmentType<{
          readonly oneOf: readonly [
            {
              readonly type: 'object';
              readonly properties: { readonly kind: { readonly const: 'circle' }; readonly radius: { readonly type: 'number' } };
              readonly required: readonly ['kind', 'radius'];
            },
            {
              readonly type: 'object';
              readonly properties: { readonly kind: { readonly const: 'square' }; readonly side: { readonly type: 'number' } };
              readonly required: readonly ['kind', 'side'];
            },
          ];
        }>;
        expect(true satisfies AssertTypeEquality<Shape, { kind: 'circle'; radius: number } | { kind: 'square'; side: number }>).toBe(true);
      });

      it('Intersects a one-of-types with its sibling keywords', () => {
        // The `oneOf` is one keyword among others, so its union is intersected with the types of its siblings: here `type: 'string'` drops the `const: 1`
        // member.
        type Kind = JSONSchemaFragmentType<JSONSchemaFixtureCollection['$defs']['AssessmentKind']>;
        //   ^?
        expect(true satisfies AssertTypeEquality<Kind, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'string'; readonly oneOf: readonly [{ const: 'a' }, { const: 1 }] }>, 'a'>,
        ).toBe(true);
      });

      it('Resolves references among the fragments of a one-of-types against a collection', () => {
        type Kind = JSONSchemaFragmentType<
          { readonly oneOf: readonly [{ readonly $ref: '#/$defs/AssessmentKind' }, { readonly type: 'null' }] },
          JSONSchemaFixtureCollection
        >;
        expect(true satisfies AssertTypeEquality<Kind, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | null>).toBe(true);
      });

      it('Infers a union of types from a union of one-of-types', () => {
        // A union of fragments is distributed once, at the entry point, rather than per keyword, which would collapse a partially matching keyword to
        // `unknown`.
        // See AGENTS.md › A conditional type on a bare type parameter distributes over unions — per conditional.
        type Union = JSONSchemaFragmentType<{ readonly oneOf: readonly [{ readonly const: 1 }] } | { readonly oneOf: readonly [{ readonly const: 'a' }] }>;
        expect(true satisfies AssertTypeEquality<Union, 1 | 'a'>).toBe(true);
      });

      it('Infers never from an empty one-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly oneOf: readonly [] }>, never>).toBe(true);
      });
    });
  });
});
