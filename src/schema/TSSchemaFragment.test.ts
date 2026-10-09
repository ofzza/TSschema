import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType } from './JSONSchema/index.js';
import type { TSSchemaCollection } from './TSSchemaCollection.js';
import type { TSSchemaFragment, TSSchemaFragmentPropertyName, TSSchemaModelType, UnwrapJSONSchemaFragmentWrapper } from './TSSchemaFragment.js';
import type { TSSchemaProperty } from './TSSchemaProperty.js';

import type { default as jsonSchema } from '../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type JSONSchemaAddressModel = JSONSchemaFixtureCollection['$defs']['Address'];
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];
//   ^?
type JSONSchemaAssessmentKindFragment = JSONSchemaFixtureCollection['$defs']['AssessmentKind'];
//   ^?

/**
 * Infers the type of a model definition from the fixture schema collection, addressed by name
 */
type _FixtureModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaFixtureCollection>;

describe('TSSchemaFragment', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
  });

  describe('TSSchemaFragment', () => {
    it('Wraps a fragment given directly, with the default collection and name', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaAssessmentModel>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__collection'], JSONSchemaCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__fragmentName'], string | number>).toBe(true);
    });

    it('Wraps a fragment addressed by name from a collection, with the collection and name', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__fragmentName'], 'Assessment'>).toBe(true);
    });

    it('Wraps a fragment addressed by name from a collection wrapper', () => {
      type AssessmentWrapper = TSSchemaFragment<TSSchemaCollection<JSONSchemaFixtureCollection>, 'Assessment'>;
      expect(true satisfies AssertTypeEquality<AssessmentWrapper, TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>).toBe(true);
    });

    it('Wraps a fragment which is not a model', () => {
      type AssessmentKindWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>;
      expect(true satisfies AssertTypeEquality<AssessmentKindWrapper['__fragment'], JSONSchemaAssessmentKindFragment>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentKindWrapper['__fragmentName'], 'AssessmentKind'>).toBe(true);
    });

    it('Wraps each fragment addressed by a union of names, as a union of wrappers', () => {
      type Wrappers = TSSchemaFragment<JSONSchemaFixtureCollection, 'Address' | 'Assessment'>;
      expect(
        true satisfies AssertTypeEquality<
          Wrappers,
          TSSchemaFragment<JSONSchemaFixtureCollection, 'Address'> | TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>
        >,
      ).toBe(true);
    });

    it('Wraps every fragment of a collection when no name is given, as a union of wrappers', () => {
      type Wrappers = TSSchemaFragment<JSONSchemaFixtureCollection>;
      expect(true satisfies AssertTypeEquality<Wrappers['__fragmentName'], keyof JSONSchemaFixtureCollection['$defs']>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<Extract<Wrappers, { __fragmentName: 'Address' }>, TSSchemaFragment<JSONSchemaFixtureCollection, 'Address'>>,
      ).toBe(true);
    });

    it('Wraps another fragment of the parent collection, addressed by name from a fragment or model property wrapper', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      type AddressWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Address'>;
      expect(true satisfies AssertTypeEquality<TSSchemaFragment<AssessmentWrapper, 'Address'>, AddressWrapper>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragment<TitleWrapper, 'Address'>, AddressWrapper>).toBe(true);
    });

    it('Rejects a name not defined in the collection', () => {
      // @ts-expect-error `Unknown` is not a fragment of the fixture collection
      type _Wrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Unknown'>;
      expect(true).toBe(true);
    });

    it('Rejects a name when wrapping a fragment given directly', () => {
      // @ts-expect-error a fragment given directly is not addressed by name
      type _Wrapper = TSSchemaFragment<JSONSchemaAssessmentModel, 'Assessment'>;
      expect(true).toBe(true);
    });
  });

  describe('UnwrapJSONSchemaFragmentWrapper', () => {
    it('Unwraps a fragment wrapper', () => {
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaFragmentWrapper<TSSchemaFragment<JSONSchemaAssessmentModel>>, JSONSchemaAssessmentModel>).toBe(
        true,
      );
      expect(
        true satisfies AssertTypeEquality<
          UnwrapJSONSchemaFragmentWrapper<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>,
          JSONSchemaAssessmentModel
        >,
      ).toBe(true);
    });

    it('Returns a fragment that is not wrapped as is', () => {
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaFragmentWrapper<JSONSchemaAssessmentModel>, JSONSchemaAssessmentModel>).toBe(true);
    });

    it('Unwraps the parent model of a model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaFragmentWrapper<TitleWrapper>, JSONSchemaAssessmentModel>).toBe(true);
    });
  });

  describe('TSSchemaFragmentPropertyName', () => {
    it('Gets the property names of a model or of a model wrapper', () => {
      type AssessmentPropertyName = 'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class';
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<JSONSchemaAssessmentModel>, AssessmentPropertyName>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<TSSchemaFragment<JSONSchemaAssessmentModel>>, AssessmentPropertyName>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>, AssessmentPropertyName>,
      ).toBe(true);
    });

    it('Gets the union of property names of a union of model wrappers', () => {
      type Wrappers = TSSchemaFragment<JSONSchemaFixtureCollection, 'Address' | 'Assessment'>;
      expect(
        true satisfies AssertTypeEquality<
          TSSchemaFragmentPropertyName<Wrappers>,
          TSSchemaFragmentPropertyName<JSONSchemaAddressModel> | TSSchemaFragmentPropertyName<JSONSchemaAssessmentModel>
        >,
      ).toBe(true);
    });

    it('Gets no property names from a wrapper of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, never>).toBe(
        true,
      );
    });

    it('Gets string | number property names from the default model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName, string | number>).toBe(true);
    });
  });

  describe('TSSchemaModelType', () => {
    it("Infers a type from a fragment, which can't resolve $refs without a collection", () => {
      type Assessment = TSSchemaModelType<JSONSchemaAssessmentModel>;
      //   ^?
      expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['kind'], unknown>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['class'], unknown>).toBe(true);
    });

    it('Infers a type from a fragment, resolving $refs against an explicitly passed collection', () => {
      type Assessment = TSSchemaModelType<JSONSchemaAssessmentModel, JSONSchemaFixtureCollection>;
      expect(true satisfies AssertTypeEquality<Assessment, _FixtureModel<'Assessment'>>).toBe(true);
    });

    it("Infers a type from a fragment wrapper with no parent collection, which can't resolve $refs", () => {
      type Assessment = TSSchemaModelType<TSSchemaFragment<JSONSchemaAssessmentModel>>;
      expect(true satisfies AssertTypeEquality<Assessment['kind'], unknown>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['class'], unknown>).toBe(true);
    });

    it('Infers a type from a fragment wrapper with no parent collection, resolving $refs against an explicitly passed collection', () => {
      type Assessment = TSSchemaModelType<TSSchemaFragment<JSONSchemaAssessmentModel>, JSONSchemaFixtureCollection>;
      expect(true satisfies AssertTypeEquality<Assessment, _FixtureModel<'Assessment'>>).toBe(true);
    });

    it('Infers a type from a fragment wrapper, resolving $refs against its parent collection', () => {
      type Assessment = TSSchemaModelType<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>;
      //   ^?
      expect(true satisfies AssertTypeEquality<Assessment, _FixtureModel<'Assessment'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['kind'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['class'], _FixtureModel<'Class'> | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['record']['battery']['isProctored'], boolean>).toBe(true);
    });

    it('Infers a type from a fragment wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      type _OtherCollection = { readonly $defs: { readonly Class: { readonly type: 'string' } } };
      type Assessment = TSSchemaModelType<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>, _OtherCollection>;
      expect(true satisfies AssertTypeEquality<Assessment['class'], string | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['kind'], unknown>).toBe(true);
    });

    it('Infers a type from a wrapper of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaModelType<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, number>).toBe(true);
    });

    it('Infers the type of the parent model from a model property wrapper', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaModelType<TitleWrapper>, _FixtureModel<'Assessment'>>).toBe(true);
    });

    it('Infers recursively nested types', () => {
      type Assessment = TSSchemaModelType<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>;
      type AssessmentClassAssessment = Exclude<Assessment['class'], null>['assessments'] extends Array<infer U> ? U : never;
      expect(true satisfies AssertTypeEquality<Assessment, AssessmentClassAssessment>).toBe(true);
    });
  });
});
