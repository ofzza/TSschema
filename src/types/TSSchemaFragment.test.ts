import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { TSSchemaFragmentPropertyName, TSSchemaFragment, UnwrapJSONSchemaFragmentWrapper } from './TSSchemaFragment.js';

// FIXME: Append enum handling tests on top of Value and Model tests

import type { default as schoolJsonSchema } from '../../res/school.js';
import { JSONSchemaCollection } from './JSONSchema.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?

describe('TSSchemaFragment', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('TSSchemaFragment', () => {
    type AssessmentDefinition = TSSchemaFragment<JSONSchemaAssessmentModel>;
    //   ^?
    type SchoolJsonSchemaCollectionAssessmentDefinition = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
    //   ^?

    // Wrapping a JSON schema definition should yield the same internal definition as wrapping it by addressing it from collection by name
    expect(true satisfies AssertTypeEquality<AssessmentDefinition['__model'], SchoolJsonSchemaCollectionAssessmentDefinition['__model']>).toBe(true);

    // Wrapping a JSON schema definition directly will wrap it with a default parent collection type
    expect(true satisfies AssertTypeEquality<AssessmentDefinition['__collection'], JSONSchemaCollection>).toBe(true);
    // Wrapping a JSON schema definition by addressing it from collection by name will wrap it with a parent collection type
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinition['__collection'], JSONSchemaSchoolCollection>).toBe(true);

    // Wrapping a JSON schema definition directly will wrap it with a default name
    expect(true satisfies AssertTypeEquality<AssessmentDefinition['__modelName'], string | number>).toBe(true);
    // Wrapping a JSON schema definition by addressing it from collection by name will wrap it with its name
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinition['__modelName'], 'Assessment'>).toBe(true);
  });

  it('UnwrapJSONSchemaWrapper', () => {
    type UnwrappedAssessmentJsonSchema = UnwrapJSONSchemaFragmentWrapper<JSONSchemaAssessmentModel>;
    //   ^?
    type UnwrappedAssessmentJsonSchemaWrapper = UnwrapJSONSchemaFragmentWrapper<TSSchemaFragment<JSONSchemaAssessmentModel>>;
    //   ^?

    // Unwrapping a JSON schema definition or a JSON schema definition wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentJsonSchema, UnwrappedAssessmentJsonSchemaWrapper>).toBe(true);
  });

  it('TSSchemaFragmentPropertyName', () => {
    type DefaultSchemaDefinitionName = TSSchemaFragmentPropertyName;
    //   ^?
    type SchoolSchemaDefinitionName = TSSchemaFragmentPropertyName<TSSchemaFragment<JSONSchemaAssessmentModel>>;
    //   ^?

    // Default TS Schema definition model property names are typed as string | number | symbol
    expect(true satisfies AssertTypeEquality<DefaultSchemaDefinitionName, string | number>).toBe(true);
    // TSSchema model property with a specific JSON schema definition should have the corresponding definition model property names
    expect(
      true satisfies AssertTypeEquality<
        SchoolSchemaDefinitionName,
        'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class'
      >,
    ).toBe(true);
  });

  it('TSSchemaFragmentType', () => {
    // !FIXME: Implement type inference testing
  });
});
