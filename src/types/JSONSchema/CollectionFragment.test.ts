import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable, AssertTypeUnassignable } from '@ofzza/tsstd';
import type {
  JSONSchemaCollection,
  JSONSchemaFragmentIsCollection,
  JSONSchemaFragmentIsModel,
  JSONSchemaFragmentIsNotCollection,
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaFragmentIsReference,
  JSONSchemaFragmentName,
  JSONSchemaNotCollectionFragment,
} from './index.js';

import type { default as schoolJsonSchema } from '../../../res/school.json';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type AssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];

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
    describe('Collection fragment', () => {
      it('Detects a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<JSONSchemaSchoolCollection>, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<JSONSchemaSchoolCollection>, false>).toBe(true);
        expect(true satisfies AssertTypeAssignable<JSONSchemaSchoolCollection, JSONSchemaCollection>).toBe(true);
        expect(true satisfies AssertTypeUnassignable<JSONSchemaSchoolCollection, JSONSchemaNotCollectionFragment>).toBe(true);
      });

      it('Detects a non-collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<AssessmentModel>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<AssessmentModel>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<AssessmentModel, JSONSchemaNotCollectionFragment>).toBe(true);
      });

      it('Rejects every fragment kind for a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<JSONSchemaSchoolCollection>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<{ $defs: {}; $ref: '#/$defs/A' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ $defs: {}; type: 'string' }>, false>).toBe(true);
      });

      it('Gets the names of all fragments of a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentName<_JSONSchemaTreeCollection>, 'Node'>).toBe(true);
        expect(true satisfies AssertTypeAssignable<'Assessment' | 'Class' | 'Term', JSONSchemaFragmentName<JSONSchemaSchoolCollection>>).toBe(true);
        expect(true satisfies AssertTypeUnassignable<'Unknown' | number, JSONSchemaFragmentName<JSONSchemaSchoolCollection>>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentName<{ $defs: {} }>, never>).toBe(true);
      });

      it('Gets string | number fragment names from the default collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentName, string | number>).toBe(true);
      });
    });
  });
});
