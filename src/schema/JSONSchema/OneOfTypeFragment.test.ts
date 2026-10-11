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
  describe('JSONSchema fragments', () => {
    describe('OneOf fragment', () => {
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
        type Union = JSONSchemaFragmentType<{ readonly oneOf: readonly [{ readonly const: 1 }] } | { readonly oneOf: readonly [{ readonly const: 'a' }] }>;
        expect(true satisfies AssertTypeEquality<Union, 1 | 'a'>).toBe(true);
      });

      it('Infers never from an empty one-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly oneOf: readonly [] }>, never>).toBe(true);
      });
    });
  });
});
