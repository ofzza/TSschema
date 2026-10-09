import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsObjectType, JSONSchemaObjectTypeFragment, JSONSchemaObjectTypeFragmentType } from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type AssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('Object Type fragment', () => {
      it('Detects an object type', () => {
        const _objectTypeFragment = { type: 'object' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<typeof _objectTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _objectTypeFragment, JSONSchemaObjectTypeFragment>).toBe(true);
      });

      it('Rejects a non-object type', () => {
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
