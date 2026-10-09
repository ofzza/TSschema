import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType } from './JSONSchema/index.js';
import type { TSSchemaFragmentName } from './TSSchemaCollection.js';
import type { TSSchemaModelType } from './TSSchemaFragment.js';
import type { TSSchemaCollection, TSSchemaFragment, TSSchemaName, TSSchemaProperty, TSSchemaType } from './index.js';

import type { default as schoolJsonSchema } from '../../res/school.json';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type JSONSchemaAssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?

/**
 * Infers the type of a model definition from the school schema collection, addressed by name
 */
type _SchoolModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaSchoolCollection>;

/**
 * Names of all properties of the `Assessment` model
 */
type _AssessmentPropertyName = 'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class';

describe('index', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  describe('TSSchemaName', () => {
    it('Gets the fragment names of a collection or a collection wrapper', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<JSONSchemaSchoolCollection>, TSSchemaFragmentName<JSONSchemaSchoolCollection>>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaName<TSSchemaCollection<JSONSchemaSchoolCollection>>, TSSchemaFragmentName<JSONSchemaSchoolCollection>>,
      ).toBe(true);
    });

    it('Gets the property names of a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<JSONSchemaAssessmentModel>, _AssessmentPropertyName>).toBe(true);
    });

    it('Gets the property names of the model wrapped by a fragment wrapper', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>>, _AssessmentPropertyName>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaName<TSSchemaFragment<JSONSchemaAssessmentModel>>, _AssessmentPropertyName>).toBe(true);
    });

    it('Gets the property names of the parent model of a model property wrapper', () => {
      expect(
        true satisfies AssertTypeEquality<TSSchemaName<TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>>, _AssessmentPropertyName>,
      ).toBe(true);
    });

    it('Gets no names from a wrapper of a fragment which is not a model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaName<TSSchemaFragment<JSONSchemaSchoolCollection, 'AssessmentKind'>>, never>).toBe(true);
    });
  });

  describe('TSSchemaType', () => {
    it('Infers a type from a fragment, resolving $refs only against an explicitly passed collection', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaType<JSONSchemaAssessmentModel>['kind'], unknown>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<JSONSchemaAssessmentModel, JSONSchemaSchoolCollection>, _SchoolModel<'Assessment'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<JSONSchemaAssessmentModel['properties']['title']>, string>).toBe(true);
    });

    it('Infers the type of the fragment wrapped by a fragment wrapper', () => {
      type AssessmentWrapper = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
      expect(true satisfies AssertTypeEquality<TSSchemaType<AssessmentWrapper>, TSSchemaModelType<AssessmentWrapper>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<AssessmentWrapper>, _SchoolModel<'Assessment'>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaFragment<JSONSchemaSchoolCollection, 'AssessmentKind'>>, number>).toBe(true);
    });

    it('Infers the type of the property wrapped by a model property wrapper, not of its parent model', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'kind'>>, number>).toBe(true);
      expect(
        true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'class'>>, _SchoolModel<'Class'> | null>,
      ).toBe(true);
    });

    it('Infers a type from a wrapper, resolving $refs against an explicitly passed collection over its parent collection', () => {
      type _OtherCollection = { readonly $defs: { readonly AssessmentKind: { readonly type: 'string' } } };
      type KindWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'kind'>;
      expect(true satisfies AssertTypeEquality<TSSchemaType<KindWrapper, _OtherCollection>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaProperty<JSONSchemaAssessmentModel, 'kind'>, JSONSchemaSchoolCollection>, number>).toBe(
        true,
      );
    });

    it('Infers a union of types from a union of model property wrappers', () => {
      type Wrappers = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title' | 'kind' | 'isOpenBook'>;
      expect(true satisfies AssertTypeEquality<TSSchemaType<Wrappers>, string | number | boolean>).toBe(true);
    });
  });
});
