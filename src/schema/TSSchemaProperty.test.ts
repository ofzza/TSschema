import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType, JSONSchemaModelFragment } from './JSONSchema/index.js';
import type { TSSchemaCollection } from './TSSchemaCollection.js';
import type { TSSchemaFragment } from './TSSchemaFragment.js';
import type { TSSchemaProperty, TSSchemaPropertyType, UnwrapJSONSchemaModelPropertyWrapper } from './TSSchemaProperty.js';

import type { default as jsonSchema } from '../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];
//   ^?
type JSONSchemaAssessmentTitleProperty = JSONSchemaAssessmentModel['properties']['title'];
//   ^?
type JSONSchemaAssessmentKindProperty = JSONSchemaAssessmentModel['properties']['kind'];
//   ^?

/**
 * Infers the type of a model definition from the fixture schema collection, addressed by name
 */
type _FixtureModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaFixtureCollection>;

/**
 * Model fragment with an inline nested model property, used to test wrapping a model as a property
 */
type _JSONSchemaNestingModel = {
  readonly type: 'object';
  readonly properties: { readonly nested: { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'string' } } } };
};

describe('TSSchemaProperty', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
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

      type CollectionTitleWrapper = TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>, 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__fragmentName'], 'Assessment'>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);
    });

    it('Wraps a property addressed by model and property name from a collection or a collection wrapper, with the model and its context', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragmentName'], 'Assessment'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);

      type CollectionWrapperTitleWrapper = TSSchemaProperty<TSSchemaCollection<JSONSchemaFixtureCollection>, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<CollectionWrapperTitleWrapper, TitleWrapper>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>, 'title'>, TitleWrapper>).toBe(
        true,
      );
    });

    it('Wraps a model given directly with no property name as a property', () => {
      type NestedWrapper = TSSchemaProperty<_JSONSchemaNestingModel['properties']['nested']>;
      expect(true satisfies AssertTypeEquality<NestedWrapper['__property'], _JSONSchemaNestingModel['properties']['nested']>).toBe(true);
      expect(true satisfies AssertTypeEquality<NestedWrapper['__fragment'], JSONSchemaModelFragment>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<_JSONSchemaNestingModel, 'nested'>['__fragment'], _JSONSchemaNestingModel>).toBe(true);
    });

    it('Wraps each property addressed by a union of names, as a union of wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'id' | 'title'>;
      expect(
        true satisfies AssertTypeEquality<
          Wrappers,
          TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'id'> | TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps every property of a model wrapper, or of a model addressed from a collection, when no property name is given', () => {
      type AssessmentPropertyName = 'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class';
      type CollectionWrappers = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment'>;
      type ModelWrapperWrappers = TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>;
      expect(true satisfies AssertTypeEquality<CollectionWrappers['__propertyName'], AssessmentPropertyName>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionWrappers, ModelWrapperWrappers>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<
          Extract<CollectionWrappers, { __propertyName: 'title' }>,
          TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps every property of every model of a collection when no name is given', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaFixtureCollection>;
      // Fragments which are not models (e.g. `AssessmentKind`) have no properties to wrap
      expect(true satisfies AssertTypeEquality<Extract<Wrappers['__fragmentName'], 'AssessmentKind'>, never>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<
          Extract<Wrappers, { __fragmentName: 'Assessment'; __propertyName: 'title' }>,
          TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps no property of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'AssessmentKind'>, never>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, never>).toBe(true);
    });

    it('Wraps a sibling property addressed by name from a model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TitleWrapper, 'id'>, TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'id'>>).toBe(
        true,
      );
    });

    it('Rejects a property name not defined in the model', () => {
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _ModelWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'unknown'>;
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'unknown'>;
      expect(true).toBe(true);
    });

    it('Rejects a property name of a fragment which is not a model', () => {
      // @ts-expect-error `AssessmentKind` is not a model, so has no properties
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'AssessmentKind', 'value'>;
      // @ts-expect-error `AssessmentKind` is not a model, so has no properties
      type _FragmentWrapper = TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>, 'value'>;
      expect(true).toBe(true);
    });

    it('Rejects a model name not defined in the collection', () => {
      // @ts-expect-error `Unknown` is not a fragment of the fixture collection
      type _Wrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Unknown', 'title'>;
      expect(true).toBe(true);
    });
  });

  describe('TSSchemaProperty paths', () => {
    it('Wraps a property addressed by a path, with its own parent model, from a collection, a collection wrapper or a model wrapper', () => {
      type NameWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.name'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<NameWrapper['__property'], JSONSchemaFixtureCollection['$defs']['Class']['properties']['name']>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__propertyName'], 'name'>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__fragment'], JSONSchemaFixtureCollection['$defs']['Class']>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__fragmentName'], 'Class'>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper, TSSchemaProperty<JSONSchemaFixtureCollection, 'Class', 'name'>>).toBe(true);

      expect(
        true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaCollection<JSONSchemaFixtureCollection>, 'Assessment', 'class.name'>, NameWrapper>,
      ).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>, 'class.name'>, NameWrapper>).toBe(
        true,
      );
    });

    it('Wraps a property addressed by a path through several nested models, references and nullable references', () => {
      type EmailWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.professor.email'>;
      expect(true satisfies AssertTypeEquality<EmailWrapper, TSSchemaProperty<JSONSchemaFixtureCollection, 'Person', 'email'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<EmailWrapper>, string>).toBe(true);
    });

    it('Wraps a property addressed by a path through a recursive model', () => {
      type EmailWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.professor.mentor.mentor.mentor.email'>;
      expect(true satisfies AssertTypeEquality<EmailWrapper, TSSchemaProperty<JSONSchemaFixtureCollection, 'Person', 'email'>>).toBe(true);
    });

    it('Wraps a property addressed by a path through the items of an array', () => {
      type EmailWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.students.email'>;
      expect(true satisfies AssertTypeEquality<EmailWrapper, TSSchemaProperty<JSONSchemaFixtureCollection, 'Person', 'email'>>).toBe(true);
    });

    it('Wraps a property addressed by a path through an inline nested model', () => {
      type AWrapper = TSSchemaProperty<_JSONSchemaNestingModel, 'nested.a'>;
      expect(true satisfies AssertTypeEquality<AWrapper, TSSchemaProperty<_JSONSchemaNestingModel['properties']['nested'], 'a'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<AWrapper>, string>).toBe(true);
    });

    it('Wraps a property addressed by a path through every member of an anyOf, oneOf or allOf, as a union of wrappers', () => {
      type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'string' } } };
      type _ModelB = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' }; readonly b: { readonly type: 'boolean' } } };
      type _Model = {
        readonly type: 'object';
        readonly properties: {
          readonly any: { readonly anyOf: readonly [_ModelA, _ModelB] };
          readonly one: { readonly oneOf: readonly [_ModelA, _ModelB] };
          readonly all: { readonly allOf: readonly [_ModelA, _ModelB] };
        };
      };
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<_Model, 'any.a'>, TSSchemaProperty<_ModelA, 'a'> | TSSchemaProperty<_ModelB, 'a'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<_Model, 'any.a'>>, string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<_Model, 'one.b'>, TSSchemaProperty<_ModelB, 'b'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<_Model, 'all.b'>, TSSchemaProperty<_ModelB, 'b'>>).toBe(true);
    });

    it('Wraps a property addressed by a path into an object of unknown shape as a property of unknown type', () => {
      type DepartmentWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'School', 'departments.x.y'>;
      expect(true satisfies AssertTypeEquality<DepartmentWrapper['__propertyName'], 'x.y'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<DepartmentWrapper>, unknown>).toBe(true);

      // A model given directly has no collection to resolve its `$ref`s against
      type NameWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'class.name'>;
      expect(true satisfies AssertTypeEquality<NameWrapper['__propertyName'], 'name'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<NameWrapper>, unknown>).toBe(true);

      type _ArrayModel = { readonly type: 'object'; readonly properties: { readonly list: { readonly type: 'array' } } };
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<_ArrayModel, 'list.x'>>, unknown>).toBe(true);
    });

    it('Wraps each property addressed by a union of names and paths, as a union of wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title' | 'class.professor.email'>;
      expect(
        true satisfies AssertTypeEquality<
          Wrappers,
          TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'> | TSSchemaProperty<JSONSchemaFixtureCollection, 'Person', 'email'>
        >,
      ).toBe(true);
    });

    it('Wraps a property addressed by a path from a sibling model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(
        true satisfies AssertTypeEquality<TSSchemaProperty<TitleWrapper, 'class.name'>, TSSchemaProperty<JSONSchemaFixtureCollection, 'Class', 'name'>>,
      ).toBe(true);
    });

    it('Wraps no property for a path which does not address a property past its first segment', () => {
      // A primitive property has no properties to path into
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'id.name'>, never>).toBe(true);
      // Properties not defined in a nested model
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.mascot.name'>, never>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.professor.shoeSize'>, never>).toBe(true);
      // Paths with an empty segment
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.'>, never>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class..name'>, never>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'School', 'departments.x.'>, never>).toBe(true);
    });

    it('Rejects a path whose first segment is not a property of the model', () => {
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _ModelWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'unknown.name'>;
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'unknown.name'>;
      expect(true).toBe(true);
    });
  });

  describe('UnwrapJSONSchemaModelPropertyWrapper', () => {
    it('Unwraps a model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>;
      type CollectionTitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
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
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<JSONSchemaAssessmentKindProperty, JSONSchemaFixtureCollection>, number>).toBe(true);
    });

    it("Infers a type from a property wrapper with no parent collection, which can't resolve $refs", () => {
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>>, unknown>).toBe(true);
    });

    it('Infers a type from a property wrapper with no parent collection, resolving $refs against an explicitly passed collection', () => {
      type KindWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<KindWrapper, JSONSchemaFixtureCollection>, number>).toBe(true);
    });

    it('Infers a type from a property wrapper, resolving $refs against its parent collection', () => {
      type Assessment = _FixtureModel<'Assessment'>;
      type _Type<TName extends keyof Assessment> = TSSchemaPropertyType<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', TName>>;
      expect(true satisfies AssertTypeEquality<_Type<'title'>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'kind'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'class'>, _FixtureModel<'Class'> | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'record'>, Assessment['record']>).toBe(true);
    });

    it('Infers a type from a property wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      type _OtherCollection = { readonly $defs: { readonly AssessmentKind: { readonly type: 'string' } } };
      type KindWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<KindWrapper, _OtherCollection>, string>).toBe(true);
    });

    it('Infers a union of types from a union of property wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title' | 'kind' | 'isOpenBook'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<Wrappers>, string | number | boolean>).toBe(true);
    });
  });
});
