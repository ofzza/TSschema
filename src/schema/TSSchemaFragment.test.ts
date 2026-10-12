import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType } from './JSONSchema/index.js';
import type { TSSchemaCollection } from './TSSchemaCollection.js';
import type { TSSchemaFragment, TSSchemaFragmentPropertyName, TSSchemaFragmentType, UnwrapJSONSchemaFragmentWrapper } from './TSSchemaFragment.js';
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

/**
 * Collection whose fragments carry `type` arrays naming non primitive types (nullable and mixed type models and arrays), used to test splitting them
 * into branches
 */
type _TypeArrayCollection = {
  readonly $defs: {
    readonly Node: {
      readonly type: readonly ['object', 'null'];
      readonly properties: {
        readonly value: { readonly type: 'string' };
        readonly next: { readonly $ref: '#/$defs/Node' };
        readonly tags: { readonly type: readonly ['array', 'null']; readonly items: { readonly type: 'string' } };
        readonly child: { readonly type: readonly ['object', 'null']; readonly properties: { readonly x: { readonly type: 'number' } } };
      };
    };
    readonly Mixed: {
      readonly type: readonly ['object', 'array', 'string', 'null'];
      readonly properties: { readonly a: { readonly type: 'number' } };
      readonly items: { readonly type: 'boolean' };
    };
  };
};

describe('TSSchemaFragment', () => {
  // Wrapping a single fragment, given directly or addressed by definition name, unwrapping it, and getting its property names and value
  // type. Uses the res/sidecar/schema.json fixture (imported through its sidecar for literal types) for realistic models and `$ref`s, and the
  // inline _TypeArrayCollection for `type` arrays naming non primitive types. Type level only: each AssertTypeEquality is consumed through
  // `expect(true satisfies ...)` so both Vitest pools check it, and invalid names are asserted with `@ts-expect-error`.
  it('Imports the testing schema with literal types', () => {
    // Guards every other assertion: were the sidecar not picked up, the fixture would be widened (or `any`) and the equalities meaningless.
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
  });

  describe('TSSchemaFragment', () => {
    it('Wraps a fragment given directly, with the default collection and name', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaAssessmentModel>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__collection'], JSONSchemaCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__definitionName'], string | number>).toBe(true);
    });

    it('Wraps a fragment addressed by name from a collection, with the collection and name', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentWrapper['__definitionName'], 'Assessment'>).toBe(true);
    });

    it('Wraps a fragment addressed by name from a collection wrapper', () => {
      type AssessmentWrapper = TSSchemaFragment<TSSchemaCollection<JSONSchemaFixtureCollection>, 'Assessment'>;
      expect(true satisfies AssertTypeEquality<AssessmentWrapper, TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>).toBe(true);
    });

    it('Wraps a fragment which is not a model', () => {
      type AssessmentKindWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>;
      expect(true satisfies AssertTypeEquality<AssessmentKindWrapper['__fragment'], JSONSchemaAssessmentKindFragment>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentKindWrapper['__definitionName'], 'AssessmentKind'>).toBe(true);
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
      // The name parameter defaults to `never`, which would distribute over nothing and wrap nothing were it not guarded.
      // See AGENTS.md › A name parameter defaulting to `never` must be guarded before a distributive check.
      type Wrappers = TSSchemaFragment<JSONSchemaFixtureCollection>;
      expect(true satisfies AssertTypeEquality<Wrappers['__definitionName'], keyof JSONSchemaFixtureCollection['$defs']>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<Extract<Wrappers, { __definitionName: 'Address' }>, TSSchemaFragment<JSONSchemaFixtureCollection, 'Address'>>,
      ).toBe(true);
    });

    it('Wraps another fragment of the parent collection, addressed by name from a fragment or model property wrapper', () => {
      // Every wrapper is also a collection wrapper, so it can be passed wherever a collection is accepted. See AGENTS.md › Wrappers nest structurally.
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
      // The name parameter of a fragment given directly is constrained to `never`, as there is no collection to address it in.
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
      // A property wrapper is the fragment wrapper of its parent model. See AGENTS.md › Wrappers nest structurally.
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

    it('Gets the property names of the object branch of a type array, e.g. of a nullable model', () => {
      // A model whose `type` is an array is split into branches before matching its shape, and only the object branch has properties.
      // See AGENTS.md › A `type` array naming `object`, `array` and / or `null` is split into a union of branches.
      type NodePropertyName = 'value' | 'next' | 'tags' | 'child';
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<TSSchemaFragment<_TypeArrayCollection, 'Node'>>, NodePropertyName>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<TSSchemaFragment<_TypeArrayCollection, 'Mixed'>>, 'a'>).toBe(true);
    });

    it('Gets no property names from a wrapper of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, never>).toBe(
        true,
      );
    });

    it('Gets string | number property names from the default model', () => {
      // The default model's `properties` is a string-keyed record, and `keyof` of a string index signature is `string | number`.
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentPropertyName, string | number>).toBe(true);
    });
  });

  describe('TSSchemaFragmentType', () => {
    it("Infers a type from a fragment, which can't resolve $refs without a collection", () => {
      // `$ref`s against the unspecified collection infer `unknown`, so only the properties with inline types are known.
      type Assessment = TSSchemaFragmentType<JSONSchemaAssessmentModel>;
      //   ^?
      expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['kind'], unknown>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['class'], unknown>).toBe(true);
    });

    it('Infers a type from a fragment, resolving $refs against an explicitly passed collection', () => {
      type Assessment = TSSchemaFragmentType<JSONSchemaAssessmentModel, JSONSchemaFixtureCollection>;
      expect(true satisfies AssertTypeEquality<Assessment, _FixtureModel<'Assessment'>>).toBe(true);
    });

    it("Infers a type from a fragment wrapper with no parent collection, which can't resolve $refs", () => {
      type Assessment = TSSchemaFragmentType<TSSchemaFragment<JSONSchemaAssessmentModel>>;
      expect(true satisfies AssertTypeEquality<Assessment['kind'], unknown>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['class'], unknown>).toBe(true);
    });

    it('Infers a type from a fragment wrapper with no parent collection, resolving $refs against an explicitly passed collection', () => {
      type Assessment = TSSchemaFragmentType<TSSchemaFragment<JSONSchemaAssessmentModel>, JSONSchemaFixtureCollection>;
      expect(true satisfies AssertTypeEquality<Assessment, _FixtureModel<'Assessment'>>).toBe(true);
    });

    it('Infers a type from a fragment wrapper, resolving $refs against its parent collection', () => {
      // `kind` and `class` are compared through Pick, as they are not listed in `required` and so are optional in the model's type.
      // See AGENTS.md › Model properties are optional unless listed in `required`.
      type Assessment = TSSchemaFragmentType<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>;
      //   ^?
      expect(true satisfies AssertTypeEquality<Assessment, _FixtureModel<'Assessment'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<Pick<Assessment, 'kind'>, { kind?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }>).toBe(true);
      expect(true satisfies AssertTypeEquality<Pick<Assessment, 'class'>, { class?: _FixtureModel<'Class'> | null }>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['record']['battery']['isProctored'], boolean>).toBe(true);
    });

    it('Infers a type from a fragment wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      // _OtherCollection redefines only Class, so `class` resolves against it while the `$ref` of `kind` (to AssessmentKind) no longer resolves
      // at all. See AGENTS.md › `*Type` utilities prefer an explicitly passed collection over the wrapper's own.
      type _OtherCollection = { readonly $defs: { readonly Class: { readonly type: 'string' } } };
      type Assessment = TSSchemaFragmentType<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>, _OtherCollection>;
      expect(true satisfies AssertTypeEquality<Pick<Assessment, 'class'>, { class?: string | null }>).toBe(true);
      expect(true satisfies AssertTypeEquality<Assessment['kind'], unknown>).toBe(true);
    });

    it('Infers a type from a wrapper of a fragment which is not a model', () => {
      expect(
        true satisfies AssertTypeEquality<TSSchemaFragmentType<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>,
      ).toBe(true);
    });

    it('Infers the type of the parent model from a model property wrapper', () => {
      // Deliberate: TSSchemaFragmentType treats a property wrapper as the fragment wrapper of its parent model; TSSchemaPropertyType infers
      // the property's own type. See AGENTS.md › Wrappers nest structurally.
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentType<TitleWrapper>, _FixtureModel<'Assessment'>>).toBe(true);
    });

    it('Infers recursively nested types', () => {
      // Assessment → class → assessments[] leads back to Assessment, which must infer the very same type rather than give up.
      type Assessment = TSSchemaFragmentType<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>;
      type AssessmentClassAssessment = NonNullable<Assessment['class']>['assessments'] extends Array<infer U> ? U : never;
      expect(true satisfies AssertTypeEquality<Assessment, AssessmentClassAssessment>).toBe(true);
    });
  });
});
