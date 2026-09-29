import { describe, it, expect } from 'vitest';
import { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { TSPropertyName } from './TSSchemaModel';

import type { default as schoolJsonSchema } from '../../res/school';
import { TSSchema } from './TSSchema';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?

describe('TSSchemaModel', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('TSSchemaDefinitionModelPropertyName', () => {
    type DefaultSchemaDefinitionName = TSPropertyName;
    //   ^?
    type SchoolSchemaDefinitionName = TSPropertyName<TSSchema<JSONSchemaAssessmentModel>>;
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

  it('TSSchemaModelType', () => {
    // FIXME: Implement type inference testing
  });
});
