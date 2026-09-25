import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/std-ts';
import type { JSONSchema7 } from './JSONSchema';
import type { TSSchema } from './TSSchema';
import type { TSSchemaDefinitionName, TSSchemaDefinition } from './TSSchemaDefinition';
import type { UnwrapJSONSchemaDefinitionEnumWrapper } from './TSSchemaDefinitionEnum';
import type { UnwrapJSONSchemaDefinitionModelWrapper } from './TSSchemaDefinitionModel';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?
type AssessmentJsonSchema = SchoolJsonSchema['$defs']['Assessment'];
//   ^?
type AssessmentKindJsonSchema = SchoolJsonSchema['$defs']['AssessmentKind'];
//   ^?

describe('TSSchemaDefinition', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaDefinitionName', () => {
    type DefaultSchemaDefinitionName = TSSchemaDefinitionName;
    //   ^?
    type SchoolSchemaDefinitionName = TSSchemaDefinitionName<TSSchema<SchoolJsonSchema>>;
    //   ^?

    // Default TS Schema definition names are typed as string | number | symbol
    expect(true satisfies AssertTypeEquality<DefaultSchemaDefinitionName, string | number | symbol>).toBe(true);
    // TSSchema with a specific JSON schema should have the corresponding definition names
    expect(
      true satisfies AssertTypeEquality<
        SchoolSchemaDefinitionName,
        | 'Address'
        | 'Assessment'
        | 'AssessmentKind'
        | 'AssessmentRecord'
        | 'Book'
        | 'BookName'
        | 'Building'
        | 'Campus'
        | 'Chapter'
        | 'Class'
        | 'ClassName'
        | 'ClassSession'
        | 'DayOfWeek'
        | 'Department'
        | 'DepartmentName'
        | 'Exercise'
        | 'Library'
        | 'Person'
        | 'PersonRole'
        | 'Room'
        | 'RoomKind'
        | 'ScalarBattery'
        | 'ScalarRegister'
        | 'ScalarSeries'
        | 'School'
        | 'Section'
        | 'Term'
      >,
    ).toBe(true);
  });

  it('UnwrapJSONSchemaDefinitionEnumWrapper', () => {
    type UnwrappedAssessmentKindDefinition = UnwrapJSONSchemaDefinitionEnumWrapper<AssessmentKindJsonSchema>;
    //   ^?
    type UnwrappedAssessmentKindDefinitionWrapper = UnwrapJSONSchemaDefinitionEnumWrapper<TSSchemaDefinition<AssessmentKindJsonSchema>>;
    //   ^?
    type UnwrappedSchoolDefinitionAssessmentKindDefinitionWrapper = UnwrapJSONSchemaDefinitionEnumWrapper<
      TSSchemaDefinition<SchoolJsonSchema, 'AssessmentKind'>
    >;
    //   ^?

    // Unwrapping a JSON schema definition or a JSON schema definition wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentKindDefinition, UnwrappedAssessmentKindDefinitionWrapper>).toBe(true);
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentKindDefinitionWrapper, UnwrappedSchoolDefinitionAssessmentKindDefinitionWrapper>).toBe(true);
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentKindDefinition, UnwrappedSchoolDefinitionAssessmentKindDefinitionWrapper>).toBe(true);
  });

  it('UnwrapJSONSchemaDefinitionModelWrapper', () => {
    type UnwrappedAssessmentDefinition = UnwrapJSONSchemaDefinitionModelWrapper<AssessmentJsonSchema>;
    //   ^?
    type UnwrappedAssessmentDefinitionWrapper = UnwrapJSONSchemaDefinitionModelWrapper<TSSchemaDefinition<AssessmentJsonSchema>>;
    //   ^?
    type UnwrappedSchoolDefinitionAssessmentDefinitionWrapper = UnwrapJSONSchemaDefinitionModelWrapper<TSSchemaDefinition<SchoolJsonSchema, 'Assessment'>>;
    //   ^?

    // Unwrapping a JSON schema definition or a JSON schema definition wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentDefinition, UnwrappedAssessmentDefinitionWrapper>).toBe(true);
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentDefinitionWrapper, UnwrappedSchoolDefinitionAssessmentDefinitionWrapper>).toBe(true);
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentDefinition, UnwrappedSchoolDefinitionAssessmentDefinitionWrapper>).toBe(true);
  });

  it('TSSchemaDefinition', () => {
    type AssessmentKindDefinition = TSSchemaDefinition<AssessmentKindJsonSchema>;
    //   ^?
    type SchoolSchemaAssessmentKindDefinition = TSSchemaDefinition<SchoolJsonSchema, 'AssessmentKind'>;
    //   ^?

    // TSSchema with a specific JSON schema should have that schema as its underlying type
    expect(true satisfies AssertTypeEquality<AssessmentKindDefinition['__enum'], AssessmentKindJsonSchema>).toBe(true);
    // TSSchema with a specific JSON schema and provided definition name should extract a definition of that schema and have it as its underlying type
    expect(true satisfies AssertTypeEquality<SchoolSchemaAssessmentKindDefinition['__enum'], AssessmentKindJsonSchema>).toBe(true);

    type AssessmentDefinition = TSSchemaDefinition<AssessmentJsonSchema>;
    //   ^?
    type SchoolSchemaAssessmentDefinition = TSSchemaDefinition<SchoolJsonSchema, 'Assessment'>;
    //   ^?

    // TSSchema with a specific JSON schema should have that schema as its underlying type
    expect(true satisfies AssertTypeEquality<AssessmentDefinition['__model'], AssessmentJsonSchema>).toBe(true);
    // TSSchema with a specific JSON schema and provided definition name should extract a definition of that schema and have it as its underlying type
    expect(true satisfies AssertTypeEquality<SchoolSchemaAssessmentDefinition['__model'], AssessmentJsonSchema>).toBe(true);
  });
});
