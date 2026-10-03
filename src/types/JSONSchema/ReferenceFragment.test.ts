import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type {
  JSONSchemaFragmentIsReference,
  JSONSchemaFragmentType,
  JSONSchemaModelFragmentType,
  JSONSchemaReferenceFragment,
  JSONSchemaReferenceFragmentType,
} from './index.js';

import type { default as schoolJsonSchema } from '../../../res/school.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type AssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];

/**
 * Infers the type of a model definition from the school schema collection, addressed by name
 */
type _SchoolModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaSchoolCollection>;

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
    };
  };
};

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('$Ref fragment', () => {
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
        const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
        type AssessmentType = JSONSchemaReferenceFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AssessmentType, JSONSchemaModelFragmentType<AssessmentModel, JSONSchemaSchoolCollection>>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['id'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['kind'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['class'], _SchoolModel<'Class'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['record']['battery']['isProctored'], boolean>).toBe(true);
      });

      it('Intersects a reference with its sibling keywords', () => {
        type Address = JSONSchemaFragmentType<{ readonly $ref: '#/$defs/Address'; readonly type: 'object' }, JSONSchemaSchoolCollection>;
        expect(true satisfies AssertTypeEquality<Address['city'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Address['latitude'], number>).toBe(true);
      });

      it('Resolves a recursive reference', () => {
        type TreeNode = JSONSchemaFragmentType<{ readonly $ref: '#/$defs/Node' }, _JSONSchemaTreeCollection>;
        expect(true satisfies AssertTypeEquality<TreeNode['value'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<TreeNode['children'][number]['children'][number]['value'], string>).toBe(true);
      });

      it('Infers unknown from an unresolvable reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/$defs/Missing' }, JSONSchemaSchoolCollection>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/definitions/Address' }, JSONSchemaSchoolCollection>, unknown>).toBe(
          true,
        );
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/$defs/Address' }>, unknown>).toBe(true);
      });

      it('Infers unknown from a non-reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ type: 'string' }, JSONSchemaSchoolCollection>, unknown>).toBe(true);
      });
    });
  });
});
