import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType } from './JSONSchema/index.js';
import type { TSSchemaDefinitionName } from './TSSchemaCollection.js';
import type { TSSchemaFragmentType } from './TSSchemaFragment.js';
import type { TSSchemaCollection, TSSchemaFragment, TSSchemaName, TSSchemaProperty, TSSchemaType } from './index.js';

import type { default as jsonSchema } from '../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];
//   ^?

/**
 * Infers the type of a model definition from the fixture schema collection, addressed by name
 */
type _FixtureModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaFixtureCollection>;

/**
 * Names of all properties of the `Assessment` model
 */
type _AssessmentPropertyName = 'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class';

describe('index', () => {
  // The barrel's own types, TSSchemaName and TSSchemaType, which dispatch to the per-module name and value type utilities depending on
  // whether they are given a fragment, a collection or a wrapper. Uses the res/sidecar/schema.json fixture (imported through its sidecar for
  // literal types) and its Assessment model, comparing each result to the per-module utility it should dispatch to, or to the expected type.
  // Type level only: each AssertTypeEquality is consumed through `expect(true satisfies ...)`, so both Vitest pools check it.
  it('Imports the testing schema with literal types', () => {
    // Guards every other assertion: were the sidecar not picked up, the fixture would be widened (or `any`) and the equalities meaningless.
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
  });

  describe('TSSchemaName', () => {
    it('Gets the definition names of a collection or a collection wrapper', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<JSONSchemaFixtureCollection>, TSSchemaDefinitionName<JSONSchemaFixtureCollection>>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaName<TSSchemaCollection<JSONSchemaFixtureCollection>>, TSSchemaDefinitionName<JSONSchemaFixtureCollection>>,
      ).toBe(true);
    });

    it('Gets the property names of a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<JSONSchemaAssessmentModel>, _AssessmentPropertyName>).toBe(true);
    });

    it('Gets the property names of the model wrapped by a fragment wrapper', () => {
      // Regression: a fragment wrapper is also a collection wrapper, so TSSchemaName must test for it first or it would infer definition names.
      // See AGENTS.md › Wrappers nest structurally.
      expect(true satisfies AssertTypeEquality<TSSchemaName<TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>>, _AssessmentPropertyName>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaName<TSSchemaFragment<JSONSchemaAssessmentModel>>, _AssessmentPropertyName>).toBe(true);
    });

    it('Gets the property names of the parent model of a model property wrapper', () => {
      // A property wrapper is the fragment wrapper of its parent model, so it addresses its siblings. See AGENTS.md › Wrappers nest structurally.
      expect(
        true satisfies AssertTypeEquality<TSSchemaName<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>>, _AssessmentPropertyName>,
      ).toBe(true);
    });

    it('Gets no names from a wrapper of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, never>).toBe(true);
    });
  });

  describe('TSSchemaType', () => {
    it('Infers a type from a fragment, resolving $refs only against an explicitly passed collection', () => {
      // Without a collection, the `$ref` of the `kind` property can not be resolved and infers `unknown`.
      expect(true satisfies AssertTypeEquality<TSSchemaType<JSONSchemaAssessmentModel>['kind'], unknown>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<JSONSchemaAssessmentModel, JSONSchemaFixtureCollection>, _FixtureModel<'Assessment'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<JSONSchemaAssessmentModel['properties']['title']>, string>).toBe(true);
    });

    it('Infers the type of the fragment wrapped by a fragment wrapper', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      expect(true satisfies AssertTypeEquality<TSSchemaType<AssessmentWrapper>, TSSchemaFragmentType<AssessmentWrapper>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<AssessmentWrapper>, _FixtureModel<'Assessment'>>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaType<TSSchemaFragment<JSONSchemaFixtureCollection, 'AssessmentKind'>>, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>,
      ).toBe(true);
    });

    it('Infers the type of the property wrapped by a model property wrapper, not of its parent model', () => {
      // Regression: a property wrapper is also a fragment wrapper of its parent model, so TSSchemaType must test for it first or it would infer
      // the model's type. See AGENTS.md › Wrappers nest structurally.
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>>, string>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'kind'>>, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>,
      ).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'class'>>, _FixtureModel<'Class'> | null>,
      ).toBe(true);
    });

    it('Infers a type from a wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      // _OtherCollection redefines AssessmentKind as a string, so the result tells which collection the `$ref` was resolved against.
      // See AGENTS.md › `*Type` utilities prefer an explicitly passed collection.
      type _OtherCollection = { readonly $defs: { readonly AssessmentKind: { readonly type: 'string' } } };
      type KindWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaType<KindWrapper, _OtherCollection>, string>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<
          TSSchemaType<TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>, JSONSchemaFixtureCollection>,
          0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
        >,
      ).toBe(true);
    });

    it('Infers a union of types from a union of model property wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title' | 'kind' | 'isOpenBook'>;
      expect(true satisfies AssertTypeEquality<TSSchemaType<Wrappers>, string | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | boolean>).toBe(true);
    });
  });
});
