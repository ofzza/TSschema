import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType, JSONSchemaModelFragment } from './JSONSchema/index.js';
import type { TSSchemaCollection } from './TSSchemaCollection.js';
import type { TSSchemaFragment } from './TSSchemaFragment.js';
import type { TSSchemaProperty, TSSchemaPropertyType, UnwrapJSONSchemaModelPropertyWrapper } from './TSSchemaProperty.js';

import type { default as schoolJsonSchema } from '../../res/school.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?
type JSONSchemaAssessmentTitleProperty = JSONSchemaAssessmentModel['properties']['title'];
//   ^?
type JSONSchemaAssessmentKindProperty = JSONSchemaAssessmentModel['properties']['kind'];
//   ^?

/**
 * Infers the type of a model definition from the school schema collection, addressed by name
 */
type _SchoolModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaSchoolCollection>;

/**
 * Model fragment with an inline nested model property, used to test wrapping a model as a property
 */
type _JSONSchemaNestingModel = {
  readonly type: 'object';
  readonly properties: { readonly nested: { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'string' } } } };
};

describe('TSSchemaProperty', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  describe('TSSchemaProperty', () => {
    it('Wraps a property fragment given directly, with the default model, collection and names', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaAssessmentTitleProperty>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaModelFragment>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragmentName'], string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__collection'], JSONSchemaCollection>).toBe(true);
    });

    it('Wraps a property addressed by name from a model, with the model', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragmentName'], string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__collection'], JSONSchemaCollection>).toBe(true);
    });

    it('Wraps a property addressed by name from a model wrapper, with the model and its context', () => {
      type TitleWrapper = TSSchemaProperty<TSSchemaFragment<JSONSchemaAssessmentModel>, 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper, TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>>).toBe(true);

      type CollectionTitleWrapper = TSSchemaProperty<TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>, 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__fragmentName'], 'Assessment'>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__collection'], JSONSchemaSchoolCollection>).toBe(true);
    });

    it('Wraps a property addressed by model and property name from a collection or a collection wrapper, with the model and its context', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragmentName'], 'Assessment'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__collection'], JSONSchemaSchoolCollection>).toBe(true);

      type CollectionWrapperTitleWrapper = TSSchemaProperty<TSSchemaCollection<JSONSchemaSchoolCollection>, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<CollectionWrapperTitleWrapper, TitleWrapper>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>, 'title'>, TitleWrapper>).toBe(true);
    });

    it('Wraps a model given directly with no property name as a property', () => {
      type NestedWrapper = TSSchemaProperty<_JSONSchemaNestingModel['properties']['nested']>;
      expect(true satisfies AssertTypeEquality<NestedWrapper['__property'], _JSONSchemaNestingModel['properties']['nested']>).toBe(true);
      expect(true satisfies AssertTypeEquality<NestedWrapper['__fragment'], JSONSchemaModelFragment>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<_JSONSchemaNestingModel, 'nested'>['__fragment'], _JSONSchemaNestingModel>).toBe(true);
    });

    it('Wraps each property addressed by a union of names, as a union of wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'id' | 'title'>;
      expect(
        true satisfies AssertTypeEquality<
          Wrappers,
          TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'id'> | TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps every property of a model wrapper, or of a model addressed from a collection, when no property name is given', () => {
      type AssessmentPropertyName = 'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class';
      type CollectionWrappers = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment'>;
      type ModelWrapperWrappers = TSSchemaProperty<TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>>;
      expect(true satisfies AssertTypeEquality<CollectionWrappers['__propertyName'], AssessmentPropertyName>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionWrappers, ModelWrapperWrappers>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<
          Extract<CollectionWrappers, { __propertyName: 'title' }>,
          TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps every property of every model of a collection when no name is given', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaSchoolCollection>;
      // Fragments which are not models (e.g. `AssessmentKind`) have no properties to wrap
      expect(true satisfies AssertTypeEquality<Extract<Wrappers['__fragmentName'], 'AssessmentKind'>, never>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<
          Extract<Wrappers, { __fragmentName: 'Assessment'; __propertyName: 'title' }>,
          TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps no property of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaSchoolCollection, 'AssessmentKind'>, never>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaSchoolCollection, 'AssessmentKind'>>, never>).toBe(true);
    });

    it('Wraps a sibling property addressed by name from a model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TitleWrapper, 'id'>, TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'id'>>).toBe(
        true,
      );
    });

    it('Rejects a property name not defined in the model', () => {
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _ModelWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'unknown'>;
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'unknown'>;
      expect(true).toBe(true);
    });

    it('Rejects a property name of a fragment which is not a model', () => {
      // @ts-expect-error `AssessmentKind` is not a model, so has no properties
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'AssessmentKind', 'value'>;
      // @ts-expect-error `AssessmentKind` is not a model, so has no properties
      type _FragmentWrapper = TSSchemaProperty<TSSchemaFragment<JSONSchemaSchoolCollection, 'AssessmentKind'>, 'value'>;
      expect(true).toBe(true);
    });

    it('Rejects a model name not defined in the collection', () => {
      // @ts-expect-error `Unknown` is not a fragment of the school collection
      type _Wrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Unknown', 'title'>;
      expect(true).toBe(true);
    });
  });

  describe('UnwrapJSONSchemaModelPropertyWrapper', () => {
    it('Unwraps a model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>;
      type CollectionTitleWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaModelPropertyWrapper<TitleWrapper>, JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaModelPropertyWrapper<CollectionTitleWrapper>, JSONSchemaAssessmentTitleProperty>).toBe(true);
    });

    it('Returns a property fragment that is not wrapped as is', () => {
      expect(
        true satisfies AssertTypeEquality<UnwrapJSONSchemaModelPropertyWrapper<JSONSchemaAssessmentTitleProperty>, JSONSchemaAssessmentTitleProperty>,
      ).toBe(true);
    });
  });

  describe('TSSchemaPropertyType', () => {
    it("Infers a type from a property fragment, which can't resolve $refs without a collection", () => {
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<JSONSchemaAssessmentTitleProperty>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<JSONSchemaAssessmentKindProperty>, unknown>).toBe(true);
    });

    it('Infers a type from a property fragment, resolving $refs against an explicitly passed collection', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<JSONSchemaAssessmentKindProperty, JSONSchemaSchoolCollection>, number>).toBe(true);
    });

    it("Infers a type from a property wrapper with no parent collection, which can't resolve $refs", () => {
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>>, unknown>).toBe(true);
    });

    it('Infers a type from a property wrapper with no parent collection, resolving $refs against an explicitly passed collection', () => {
      type KindWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<KindWrapper, JSONSchemaSchoolCollection>, number>).toBe(true);
    });

    it('Infers a type from a property wrapper, resolving $refs against its parent collection', () => {
      type Assessment = _SchoolModel<'Assessment'>;
      type _Type<TName extends keyof Assessment> = TSSchemaPropertyType<TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', TName>>;
      expect(true satisfies AssertTypeEquality<_Type<'title'>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'kind'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'class'>, _SchoolModel<'Class'> | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'record'>, Assessment['record']>).toBe(true);
    });

    it('Infers a type from a property wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      type _OtherCollection = { readonly $defs: { readonly AssessmentKind: { readonly type: 'string' } } };
      type KindWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<KindWrapper, _OtherCollection>, string>).toBe(true);
    });

    it('Infers a union of types from a union of property wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title' | 'kind' | 'isOpenBook'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<Wrappers>, string | number | boolean>).toBe(true);
    });
  });
});
