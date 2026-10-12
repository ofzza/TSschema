import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsObjectType, JSONSchemaObjectTypeFragment, JSONSchemaObjectTypeFragmentType } from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type AssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];

describe('JSONSchema', () => {
  // Type layer tests of ObjectTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/ObjectTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Object Type fragment', () => {
      // JSONSchemaObjectTypeFragment / JSONSchemaFragmentIsObjectType and the value type JSONSchemaObjectTypeFragmentType, inferred from a `type: 'object'`
      // fragment with no `properties`. Tested at type level only, on an inline `as const` fragment, and on the Assessment model of the res/schema.json fixture
      // as a negative, by AssertTypeEquality and AssertTypeAssignable.
      it('Detects an object type', () => {
        const _objectTypeFragment = { type: 'object' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<typeof _objectTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _objectTypeFragment, JSONSchemaObjectTypeFragment>).toBe(true);
      });

      it('Rejects a non-object type', () => {
        // A model is not an object type fragment: the object type fragment forbids `properties`, so the two never both match one fragment.
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<AssessmentModel>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<{ type: 'array' }>, false>).toBe(true);
      });

      it('Infers an object type', () => {
        const _objectTypeFragment = { type: 'object' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<typeof _objectTypeFragment>, object>).toBe(true);
      });

      it('Infers unknown from a non-object type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<AssessmentModel>, unknown>).toBe(true);
      });
    });
  });
});
