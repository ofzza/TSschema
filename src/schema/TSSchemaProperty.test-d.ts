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

describe('TSSchemaProperty', () => {
  // Wrapping a property of a model fragment, addressed by name or by dot-separated path, unwrapping it, and inferring its value type with
  // TSSchemaPropertyType. Uses the res/sidecar/schema.json fixture (imported through its sidecar for literal types) for realistic models,
  // `$ref`s and recursion, and small inline schemas (_JSONSchemaNestingModel, _TypeArrayCollection, ...) for edge cases. Type level only:
  // each AssertTypeEquality is consumed through `expect(true satisfies ...)` so both Vitest pools check it, and invalid names are asserted
  // with `@ts-expect-error`.
  it('Imports the testing schema with literal types', () => {
    // Guards every other assertion: were the sidecar not picked up, the fixture would be widened (or `any`) and the equalities meaningless.
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
  });

  describe('TSSchemaProperty', () => {
    it('Wraps a property fragment given directly, with the default model, collection and names', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaAssessmentTitleProperty>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaModelFragment>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__definitionName'], string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__collection'], JSONSchemaCollection>).toBe(true);
    });

    it('Wraps a property addressed by name from a model, with the model', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__definitionName'], string | number>).toBe(true);
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
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__definitionName'], 'Assessment'>).toBe(true);
      expect(true satisfies AssertTypeEquality<CollectionTitleWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);
    });

    it('Wraps a property addressed by model and property name from a collection or a collection wrapper, with the model and its context', () => {
      type TitleWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<TitleWrapper['__property'], JSONSchemaAssessmentTitleProperty>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__propertyName'], 'title'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__fragment'], JSONSchemaAssessmentModel>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__definitionName'], 'Assessment'>).toBe(true);
      expect(true satisfies AssertTypeEquality<TitleWrapper['__collection'], JSONSchemaFixtureCollection>).toBe(true);

      type CollectionWrapperTitleWrapper = TSSchemaProperty<TSSchemaCollection<JSONSchemaFixtureCollection>, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<CollectionWrapperTitleWrapper, TitleWrapper>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>, 'title'>, TitleWrapper>).toBe(
        true,
      );
    });

    it('Wraps a model given directly with no property name as a property', () => {
      // The exception to an omitted name wrapping every property: a model given directly with no name, such as an inline nested model, is
      // wrapped itself. See AGENTS.md › A name parameter defaulting to `never` must be guarded before a distributive check.
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
      // See AGENTS.md › A name parameter defaulting to `never` must be guarded before a distributive check.
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
      expect(true satisfies AssertTypeEquality<Extract<Wrappers['__definitionName'], 'AssessmentKind'>, never>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<
          Extract<Wrappers, { __definitionName: 'Assessment'; __propertyName: 'title' }>,
          TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>
        >,
      ).toBe(true);
    });

    it('Wraps no property of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<JSONSchemaFixtureCollection, 'AssessmentKind'>, never>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, never>).toBe(true);
    });

    it('Wraps a sibling property addressed by name from a model property wrapper', () => {
      // A property wrapper is the fragment wrapper of its parent model. See AGENTS.md › Wrappers nest structurally.
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
    });

    it('Rejects a property name of a fragment which is not a model', () => {
      // @ts-expect-error `AssessmentKind` is not a model, so has no properties
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'AssessmentKind', 'value'>;
      // @ts-expect-error `AssessmentKind` is not a model, so has no properties
      type _FragmentWrapper = TSSchemaProperty<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>, 'value'>;
    });

    it('Rejects a model name not defined in the collection', () => {
      // @ts-expect-error `Unknown` is not a fragment of the fixture collection
      type _Wrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Unknown', 'title'>;
    });
  });

  describe('TSSchemaProperty paths', () => {
    // Dot-separated paths, resolved in the body of TSSchemaProperty, where only the first segment is checked by the name constraint at the
    // call site: an invalid remainder infers `never` rather than erroring. See AGENTS.md › Paths are resolved, never enumerated.
    it('Wraps a property addressed by a path, with its own parent model, from a collection, a collection wrapper or a model wrapper', () => {
      // The wrapper is that of the last segment within its own model (Class), not of the model the path started from (Assessment).
      type NameWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.name'>;
      //   ^?
      expect(true satisfies AssertTypeEquality<NameWrapper['__property'], JSONSchemaFixtureCollection['$defs']['Class']['properties']['name']>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__propertyName'], 'name'>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__fragment'], JSONSchemaFixtureCollection['$defs']['Class']>).toBe(true);
      expect(true satisfies AssertTypeEquality<NameWrapper['__definitionName'], 'Class'>).toBe(true);
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
      // `class` and `professor` are nullable references (an `anyOf` of a `$ref` and `type: 'null'`), passed through member by member. `email` is nullable
      // itself (and optional, which its own type never shows).
      type EmailWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.professor.email'>;
      expect(true satisfies AssertTypeEquality<EmailWrapper, TSSchemaProperty<JSONSchemaFixtureCollection, 'Person', 'email'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<EmailWrapper>, string | null>).toBe(true);
    });

    it('Wraps a property addressed by a path through a recursive model', () => {
      // Person.mentor refers back to Person, so the set of valid paths is infinite and can only be resolved, never enumerated.
      type EmailWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class.professor.mentor.mentor.mentor.email'>;
      expect(true satisfies AssertTypeEquality<EmailWrapper, TSSchemaProperty<JSONSchemaFixtureCollection, 'Person', 'email'>>).toBe(true);
    });

    it('Wraps a property of, or addressed by a path through, the object branch of a type array, e.g. of a nullable model', () => {
      // See AGENTS.md › A `type` array naming `object`, `array` and / or `null` is split into a union of branches.
      type ValueWrapper = TSSchemaProperty<_TypeArrayCollection, 'Node', 'value'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<ValueWrapper>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaProperty<TSSchemaFragment<_TypeArrayCollection, 'Node'>, 'value'>, ValueWrapper>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<_TypeArrayCollection, 'Node', 'tags'>>, string[] | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<_TypeArrayCollection, 'Mixed', 'a'>>, number>).toBe(true);

      type XWrapper = TSSchemaProperty<_TypeArrayCollection, 'Node', 'next.next.child.x'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<XWrapper>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<XWrapper['__propertyName'], 'x'>).toBe(true);
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
      // Every member is pathed into, not just one: `a` is found in both models, `b` only in _ModelB, whatever the combining keyword.
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
      // Covers all three kinds of unknown shape: an object with no `properties` (School.departments, a record), a `$ref` with no collection
      // known, and an array with no single schema `items`. Its property name is the rest of the path. See AGENTS.md › A path into content of
      // unknown shape wraps the empty schema `{}`.
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
      // Models with `properties` are treated as closed, so an undefined name in a nested model is `never`, not unknown.
      // See AGENTS.md › A path into content of unknown shape wraps the empty schema `{}`.
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
      // Only the first segment is part of the name constraint, so only it can error at the call site.
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _ModelWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'unknown.name'>;
      // @ts-expect-error `unknown` is not a property of the `Assessment` model
      type _CollectionWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'unknown.name'>;
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
      expect(
        true satisfies AssertTypeEquality<TSSchemaPropertyType<JSONSchemaAssessmentKindProperty, JSONSchemaFixtureCollection>, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>,
      ).toBe(true);
    });

    it("Infers a type from a property wrapper with no parent collection, which can't resolve $refs", () => {
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<JSONSchemaAssessmentModel, 'title'>>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>>, unknown>).toBe(true);
    });

    it('Infers a type from a property wrapper with no parent collection, resolving $refs against an explicitly passed collection', () => {
      type KindWrapper = TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<KindWrapper, JSONSchemaFixtureCollection>, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>).toBe(true);
    });

    it('Infers a type from a property wrapper, resolving $refs against its parent collection', () => {
      // `class` is optional in its model, yet its own type includes no `undefined`.
      // See AGENTS.md › Model properties are optional unless listed in `required`.
      type Assessment = _FixtureModel<'Assessment'>;
      type _Type<TName extends keyof Assessment> = TSSchemaPropertyType<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', TName>>;
      expect(true satisfies AssertTypeEquality<_Type<'title'>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'kind'>, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'class'>, _FixtureModel<'Class'> | null>).toBe(true);
      expect(true satisfies AssertTypeEquality<_Type<'record'>, Assessment['record']>).toBe(true);
    });

    it('Infers a type from a property wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      // _OtherCollection redefines AssessmentKind as a string, so the result tells which collection the `$ref` was resolved against.
      // See AGENTS.md › `*Type` utilities prefer an explicitly passed collection over the wrapper's own.
      type _OtherCollection = { readonly $defs: { readonly AssessmentKind: { readonly type: 'string' } } };
      type KindWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<KindWrapper, _OtherCollection>, string>).toBe(true);
    });

    it('Infers a union of types from a union of property wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title' | 'kind' | 'isOpenBook'>;
      expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<Wrappers>, string | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | boolean>).toBe(true);
    });
  });
});
