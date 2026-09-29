import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { TSSchema, UnwrapJSONSchemaWrapper } from './TSSchema';

// FIXME: Append enum handling tests on top of Value and Model tests

import type { default as schoolJsonSchema } from '../../res/school';
import { JSONSchemaCollection } from './JSONSchema';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?

describe('TSSchema', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('TSSchema', () => {
    type AssessmentDefinition = TSSchema<JSONSchemaAssessmentModel>;
    //   ^?
    type SchoolJsonSchemaCollectionAssessmentDefinition = TSSchema<JSONSchemaSchoolCollection, 'Assessment'>;
    //   ^?

    // Wrapping a JSON schema definition should yield the same internal definition as wrapping it by addressing it from collection by name
    expect(true satisfies AssertTypeEquality<AssessmentDefinition['__definition'], SchoolJsonSchemaCollectionAssessmentDefinition['__definition']>).toBe(true);

    // Wrapping a JSON schema definition directly will wrap it with a default parent collection type
    expect(true satisfies AssertTypeEquality<AssessmentDefinition['__collection'], JSONSchemaCollection>).toBe(true);
    // Wrapping a JSON schema definition by addressing it from collection by name will wrap it with a parent collection type
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinition['__collection'], JSONSchemaSchoolCollection>).toBe(true);
  });

  it('UnwrapJSONSchemaWrapper', () => {
    type UnwrappedAssessmentJsonSchema = UnwrapJSONSchemaWrapper<JSONSchemaAssessmentModel>;
    //   ^?
    type UnwrappedAssessmentJsonSchemaWrapper = UnwrapJSONSchemaWrapper<TSSchema<JSONSchemaAssessmentModel>>;
    //   ^?

    // Unwrapping a JSON schema definition or a JSON schema definition wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentJsonSchema, UnwrappedAssessmentJsonSchemaWrapper>).toBe(true);
  });

  it('TSSchemaType', () => {
    // FIXME: Implement type inference testing
  });
});
