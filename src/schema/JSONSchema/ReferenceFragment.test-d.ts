import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type {
  JSONSchemaFragmentIsReference,
  JSONSchemaFragmentType,
  JSONSchemaModelFragmentType,
  JSONSchemaReferenceFragment,
  JSONSchemaReferenceFragmentType,
} from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type AssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];

/**
 * Infers the type of a model definition from the fixture schema collection, addressed by name
 */
type _FixtureModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaFixtureCollection>;

/**
 * Self-referencing schema collection: a tree of nodes
 */
type _JSONSchemaTreeCollection = {
  readonly $defs: {
    readonly Node: {
      readonly type: 'object';
      readonly properties: {
        readonly value: { readonly type: 'string' };
        readonly children: { readonly type: 'array'; readonly items: { readonly $ref: '#/$defs/Node' } };
      };
      readonly required: readonly ['value', 'children'];
    };
  };
};

describe('JSONSchema', () => {
  // Type layer tests of ReferenceFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/ReferenceFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('$Ref fragment', () => {
      // JSONSchemaReferenceFragment / JSONSchemaFragmentIsReference and the value type JSONSchemaReferenceFragmentType, resolving `#/$defs/<name>` against a
      // collection. Tested at type level only, against the res/schema.json fixture (whose models reference each other and enums) and a small inline recursive
      // collection, by AssertTypeEquality and AssertTypeAssignable.
      it('Detects a reference', () => {
        const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<typeof _refTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _refTypeFragment, JSONSchemaReferenceFragment>).toBe(true);
      });

      it('Rejects a non-reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<AssessmentModel>, false>).toBe(true);
      });

      it('Resolves a reference against a collection', () => {
        // `kind` and `class` are not in Assessment's `required`, so they are compared through `Pick`, keeping them optional, where indexing the type would add
        // `undefined`.
        const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
        type AssessmentType = JSONSchemaReferenceFragmentType<typeof _refTypeFragment, JSONSchemaFixtureCollection>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AssessmentType, JSONSchemaModelFragmentType<AssessmentModel, JSONSchemaFixtureCollection>>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['id'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<AssessmentType, 'kind'>, { kind?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<AssessmentType, 'class'>, { class?: _FixtureModel<'Class'> | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['record']['battery']['isProctored'], boolean>).toBe(true);
      });

      it('Intersects a reference with its sibling keywords', () => {
        type Address = JSONSchemaFragmentType<{ readonly $ref: '#/$defs/Address'; readonly type: 'object' }, JSONSchemaFixtureCollection>;
        expect(true satisfies AssertTypeEquality<Address['city'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Address['latitude'], number>).toBe(true);
      });

      it('Resolves a recursive reference', () => {
        type TreeNode = JSONSchemaFragmentType<{ readonly $ref: '#/$defs/Node' }, _JSONSchemaTreeCollection>;
        expect(true satisfies AssertTypeEquality<TreeNode['value'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<TreeNode['children'][number]['children'][number]['value'], string>).toBe(true);
      });

      it('Infers unknown from an unresolvable reference', () => {
        // A missing definition, a reference not of the `#/$defs/<name>` form and any reference with no collection given (the unspecified collection) all place
        // no constraint.
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/$defs/Missing' }, JSONSchemaFixtureCollection>, unknown>).toBe(
          true,
        );
        expect(
          true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/definitions/Address' }, JSONSchemaFixtureCollection>, unknown>,
        ).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/$defs/Address' }>, unknown>).toBe(true);
      });

      it('Infers unknown from a non-reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ type: 'string' }, JSONSchemaFixtureCollection>, unknown>).toBe(true);
      });
    });
  });
});
