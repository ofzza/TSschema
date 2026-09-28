import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { TSSchemaDefinition } from './TSSchemaDefinition';
import type {
  TSSchemaDefinitionModelProperty,
  TSSchemaDefinitionModelPropertyName,
  UnwrapJSONSchemaDefinitionModelPropertyWrapper,
} from './TSSchemaDefinitionModelProperty';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?
type AssessmentJsonSchema = SchoolJsonSchema['$defs']['Assessment'];
//   ^?

describe('TSSchemaModel', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaDefinitionModelPropertyName', () => {
    type DefaultSchemaDefinitionName = TSSchemaDefinitionModelPropertyName;
    //   ^?
    type SchoolSchemaDefinitionName = TSSchemaDefinitionModelPropertyName<TSSchemaDefinition<AssessmentJsonSchema>>;
    //   ^?

    // Default TS Schema definition model property names are typed as string | number | symbol
    expect(true satisfies AssertTypeEquality<DefaultSchemaDefinitionName, string | number | symbol>).toBe(true);
    // TSSchema model property with a specific JSON schema definition should have the corresponding definition model property names
    expect(
      true satisfies AssertTypeEquality<
        SchoolSchemaDefinitionName,
        'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class'
      >,
    ).toBe(true);
  });

  it('UnwrapJSONSchemaDefinitionModelPropertyWrapper', () => {
    type UnwrappedAssessmentIdPropertyDefinition = UnwrapJSONSchemaDefinitionModelPropertyWrapper<AssessmentJsonSchema['properties']['id']>;
    //   ^?
    type UnwrappedAssessmentIdPropertyDefinitionWrapper = UnwrapJSONSchemaDefinitionModelPropertyWrapper<
      //   ^?
      TSSchemaDefinitionModelProperty<AssessmentJsonSchema, 'id'>
    >;

    // Unwrapping a JSON schema model property definition or a JSON schema model property definition wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentIdPropertyDefinition, UnwrappedAssessmentIdPropertyDefinitionWrapper>).toBe(true);
  });

  it('TSSchemaDefinitionModelProperty', () => {
    type AssessmentUnknownPropertyDefinition = TSSchemaDefinitionModelProperty<AssessmentJsonSchema>;
    //   ^?
    // Property name is mandatory
    expect(true satisfies AssertTypeEquality<AssessmentUnknownPropertyDefinition['__value'], never>).toBe(true);

    type AssessmentIdPropertyDefinition = TSSchemaDefinitionModelProperty<AssessmentJsonSchema, 'id'>;
    //   ^?
    // TSSchema with a specific JSON schema model and provided model definition property name should extract a definition of that property and have it as its underlying type
    expect(true satisfies AssertTypeEquality<AssessmentIdPropertyDefinition['__value'], AssessmentJsonSchema['properties']['id']>).toBe(true);
  });
});
