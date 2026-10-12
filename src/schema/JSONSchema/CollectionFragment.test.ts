import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable, AssertTypeUnassignable } from '@ofzza/tsstd';
import type {
  JSONSchemaCollection,
  JSONSchemaFragmentIsCollection,
  JSONSchemaFragmentIsModel,
  JSONSchemaFragmentIsNotCollection,
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaFragmentIsReference,
  JSONSchemaDefinitionName,
  JSONSchemaNotCollectionFragment,
} from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type AssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];

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
  // Type layer tests of CollectionFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree, shared by every test file in this directory, is
  // kept from when src/schema/JSONSchema/ was a single file, so test names did not change with the split. src/reflection/JSONSchema/CollectionFragment.test.ts
  // is the runtime mirror of this file.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Collection fragment', () => {
      // JSONSchemaFragmentIsCollection / JSONSchemaFragmentIsNotCollection, the JSONSchemaCollection / JSONSchemaNotCollectionFragment types and the
      // JSONSchemaDefinitionName utility. Tested at type level only, on the res/schema.json fixture (a collection) and its Assessment model (a fragment which
      // is not one), and on a small inline self-referencing collection with a single, known definition name, by AssertTypeEquality and AssertTypeAssignable /
      // AssertTypeUnassignable.
      it('Detects a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<JSONSchemaFixtureCollection>, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<JSONSchemaFixtureCollection>, false>).toBe(true);
        expect(true satisfies AssertTypeAssignable<JSONSchemaFixtureCollection, JSONSchemaCollection>).toBe(true);
        expect(true satisfies AssertTypeUnassignable<JSONSchemaFixtureCollection, JSONSchemaNotCollectionFragment>).toBe(true);
      });

      it('Detects a non-collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<AssessmentModel>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<AssessmentModel>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<AssessmentModel, JSONSchemaNotCollectionFragment>).toBe(true);
      });

      it('Rejects every fragment kind for a collection', () => {
        // A fragment with `$defs` is a collection and nothing else: every per-keyword fragment type is a JSONSchemaNotCollectionFragment, which forbids
        // `$defs`.
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<JSONSchemaFixtureCollection>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<{ $defs: {}; $ref: '#/$defs/A' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ $defs: {}; type: 'string' }>, false>).toBe(true);
      });

      it('Gets the names of all definitions of a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaDefinitionName<_JSONSchemaTreeCollection>, 'Node'>).toBe(true);
        expect(true satisfies AssertTypeAssignable<'Assessment' | 'Class' | 'Term', JSONSchemaDefinitionName<JSONSchemaFixtureCollection>>).toBe(true);
        expect(true satisfies AssertTypeUnassignable<'Unknown' | number, JSONSchemaDefinitionName<JSONSchemaFixtureCollection>>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaDefinitionName<{ $defs: {} }>, never>).toBe(true);
      });

      it('Gets string | number definition names from the default collection', () => {
        // The unspecified collection, standing for "no collection known", has `Record<string, …>` definitions, whose `keyof` is `string | number`.
        expect(true satisfies AssertTypeEquality<JSONSchemaDefinitionName, string | number>).toBe(true);
      });
    });
  });
});
