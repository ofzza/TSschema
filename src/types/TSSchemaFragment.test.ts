import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { TSSchemaFragmentPropertyName, TSSchemaFragment, UnwrapJSONSchemaFragmentWrapper, TSSchemaFragmentType } from './TSSchemaFragment.js';

import type { default as schoolJsonSchema } from '../../res/school.js';
import { JSONSchemaCollection, JSONSchemaFragmentType } from './JSONSchema.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?

/**
 * Infers the type of a model definition from the school schema collection, addressed by name
 */
type _SchoolModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaSchoolCollection>;

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

  describe('TSSchemaFragmentType', () => {
    it("Types inferred from fragments, with no reference to parent JSON schema collection can't resolve $refs", () => {
      type JSONSchemaAssessmentModelType = TSSchemaFragmentType<JSONSchemaAssessmentModel>;
      //   ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaAssessmentModelType['class'], unknown>).toBe(true);
    });

    it('Types inferred from fragments, with explicitly passed reference to parent JSON schema collection can resolve $refs', () => {
      type JSONSchemaAssessmentModelWithExplicitSchoolJsonSchemaCollectionType = TSSchemaFragmentType<JSONSchemaAssessmentModel, JSONSchemaSchoolCollection>;
      expect(true satisfies AssertTypeInequality<JSONSchemaAssessmentModelWithExplicitSchoolJsonSchemaCollectionType['class'], unknown>).toBe(true);
    });

    it("Types inferred from fragment wrappers, with no internal (wrapped) reference to parent JSON schema collection can't resolve $refs", () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaAssessmentModel>;
      //   ^?
      type AssessmentWrapperType = TSSchemaFragmentType<AssessmentWrapper>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentWrapperType['class'], unknown>).toBe(true);
    });

    it("Types inferred from fragment wrappers, with no internal (wrapped) reference to parent JSON schema collection, even when explicitly passed reference to the parent JSON schema collection can't resolve $refs", () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaAssessmentModel>;
      type AssessmentWrapperWithExplicitSchoolJsonSchemaCollectionType = TSSchemaFragmentType<AssessmentWrapper, JSONSchemaSchoolCollection>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentWrapperWithExplicitSchoolJsonSchemaCollectionType['class'], unknown>).toBe(true);
    });

    it('Types inferred from fragment wrappers, with internal (wrapped) reference to parent JSON schema collection can resolve $refs', () => {
      type AssessmentWrapperWithIncludedSchoolJsonSchemaCollection = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
      //   ^?
      type AssessmentWrapperWithIncludedSchoolJsonSchemaCollectionType = TSSchemaFragmentType<AssessmentWrapperWithIncludedSchoolJsonSchemaCollection>;
      //   ^?
      expect(true satisfies AssertTypeInequality<AssessmentWrapperWithIncludedSchoolJsonSchemaCollectionType['class'], unknown>).toBe(true);
    });

    it('Non-referencing properties are inferred correctly', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaAssessmentModel>;
      type AssessmentType = TSSchemaFragmentType<AssessmentWrapper>;
      expect(true satisfies AssertTypeEquality<AssessmentType['id'], string>).toBe(true);
    });

    it('Referencing properties are inferred correctly', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
      type AssessmentType = TSSchemaFragmentType<AssessmentWrapper>;
      expect(true satisfies AssertTypeEquality<AssessmentType['kind'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['class'], _SchoolModel<'Class'> | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['record']['battery']['isProctored'], boolean>).toBe(true);
    });

    it('Recursively nested types are successfully inferred', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
      type AssessmentType = TSSchemaFragmentType<AssessmentWrapper>;
      type AssessmentClassType = AssessmentType['class'];
      type AssessmentClassNonNullableType = Exclude<AssessmentClassType, null>;
      type AssessmentClassAssessmentsType = AssessmentClassNonNullableType['assessments'];
      type AssessmentClassAssessmentsItemType = AssessmentClassAssessmentsType extends Array<infer U> ? U : never;
      expect(true satisfies AssertTypeEquality<AssessmentType, AssessmentClassAssessmentsItemType>).toBe(true);
    });
  });
});
