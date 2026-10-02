import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { TSSchemaModelProperty, UnwrapJSONSchemaModelPropertyWrapper } from './TSSchemaModelProperty.js';

import type { default as schoolJsonSchema } from '../../res/school.js';
import type { JSONSchemaCollection, JSONSchemaModelFragment } from './JSONSchema.js';
import type { TSSchemaFragment } from './TSSchemaFragment.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?
type JSONSchemaAssessmentTitleProperty = JSONSchemaAssessmentModel['properties']['title'];
//   ^?

describe('TSSchemaModel', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('TSSchemaModelProperty', () => {
    type TitleProperty = TSSchemaModelProperty<JSONSchemaAssessmentTitleProperty>;
    //   ^?
    type AssessmentTitleProperty = TSSchemaModelProperty<JSONSchemaAssessmentModel, 'title'>;
    //   ^?
    type AssessmentDefinitionTitleProperty = TSSchemaModelProperty<TSSchemaFragment<JSONSchemaAssessmentModel>, 'title'>;
    //   ^?
    type SchoolJsonSchemaCollectionAssessmentTitleProperty = TSSchemaModelProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>;
    //   ^?
    type SchoolJsonSchemaCollectionAssessmentDefinitionTitleProperty = TSSchemaModelProperty<
      TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>,
      'title'
    >;
    //   ^?

    // Wrapping a JSON schema model property definition directly, or addressing it by name from a model, a model wrapper, a collection or a collection
    // addressed model wrapper should all yield the same internal definition
    expect(true satisfies AssertTypeEquality<TitleProperty['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentTitleProperty['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentDefinitionTitleProperty['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentTitleProperty['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
    expect(
      true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinitionTitleProperty['__property'], JSONSchemaAssessmentTitleProperty>,
    ).toBe(true);

    // Wrapping a JSON schema model property definition directly will wrap it with a default parent model type
    expect(true satisfies AssertTypeEquality<TitleProperty['__model'], JSONSchemaModelFragment>).toBe(true);
    // Wrapping a JSON schema model property definition by addressing it by name will wrap it with its parent model type
    expect(true satisfies AssertTypeEquality<AssessmentTitleProperty['__model'], JSONSchemaAssessmentModel>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentDefinitionTitleProperty['__model'], JSONSchemaAssessmentModel>).toBe(true);
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentTitleProperty['__model'], JSONSchemaAssessmentModel>).toBe(true);
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinitionTitleProperty['__model'], JSONSchemaAssessmentModel>).toBe(true);

    // Wrapping a JSON schema model property definition directly, or from a model with no known collection, will wrap it with a default parent collection type
    expect(true satisfies AssertTypeEquality<TitleProperty['__collection'], JSONSchemaCollection>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentTitleProperty['__collection'], JSONSchemaCollection>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentDefinitionTitleProperty['__collection'], JSONSchemaCollection>).toBe(true);
    // Wrapping a JSON schema model property definition from a model addressed from a collection by name will wrap it with a parent collection type
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentTitleProperty['__collection'], JSONSchemaSchoolCollection>).toBe(true);
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinitionTitleProperty['__collection'], JSONSchemaSchoolCollection>).toBe(
      true,
    );

    // Wrapping a JSON schema model property definition directly will wrap it with a default name
    expect(true satisfies AssertTypeEquality<TitleProperty['__propertyName'], string | number>).toBe(true);
    // Wrapping a JSON schema model property definition by addressing it by name will wrap it with its name
    expect(true satisfies AssertTypeEquality<AssessmentTitleProperty['__propertyName'], 'title'>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentDefinitionTitleProperty['__propertyName'], 'title'>).toBe(true);
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentTitleProperty['__propertyName'], 'title'>).toBe(true);
    expect(true satisfies AssertTypeEquality<SchoolJsonSchemaCollectionAssessmentDefinitionTitleProperty['__propertyName'], 'title'>).toBe(true);
  });

  it('UnwrapJSONSchemaModelPropertyWrapper', () => {
    type UnwrappedAssessmentTitleJsonSchema = UnwrapJSONSchemaModelPropertyWrapper<JSONSchemaAssessmentTitleProperty>;
    //   ^?
    type UnwrappedAssessmentTitleJsonSchemaWrapper = UnwrapJSONSchemaModelPropertyWrapper<TSSchemaModelProperty<JSONSchemaAssessmentModel, 'title'>>;
    //   ^?
    type UnwrappedSchoolJsonSchemaCollectionAssessmentTitleJsonSchemaWrapper = UnwrapJSONSchemaModelPropertyWrapper<
      TSSchemaModelProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>
    >;
    //   ^?

    // Unwrapping a JSON schema model property definition or a JSON schema model property definition wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentTitleJsonSchema, JSONSchemaAssessmentTitleProperty>).toBe(true);
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentTitleJsonSchema, UnwrappedAssessmentTitleJsonSchemaWrapper>).toBe(true);
    expect(true satisfies AssertTypeEquality<UnwrappedAssessmentTitleJsonSchema, UnwrappedSchoolJsonSchemaCollectionAssessmentTitleJsonSchemaWrapper>).toBe(
      true,
    );
  });

  it('TSSchemaModelPropertyType', () => {
    // !FIXME: Implement type inference testing
  });
});
