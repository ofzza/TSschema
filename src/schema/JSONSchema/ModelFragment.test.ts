import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type {
  JSONSchemaFragmentIsModel,
  JSONSchemaFragmentPropertyName,
  JSONSchemaFragmentType,
  JSONSchemaModelFragment,
  JSONSchemaModelFragmentType,
} from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?
type AssessmentModel = JSONSchemaFixtureCollection['$defs']['Assessment'];

/**
 * Infers the type of a model definition from the fixture schema collection, addressed by name
 */
type _FixtureModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaFixtureCollection>;

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } } };
/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelB = { readonly type: 'object'; readonly properties: { readonly b: { readonly type: 'string' } } };

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('Model fragment', () => {
      it('Detects a model', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<AssessmentModel>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<AssessmentModel, JSONSchemaModelFragment>).toBe(true);
      });

      it('Rejects a non-model', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<{ properties: { a: { type: 'string' } } }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<{ type: 'string' }>, false>).toBe(true);
      });

      it('Gets the names of all properties of a model', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentPropertyName<_ModelA>, 'a'>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentPropertyName<AssessmentModel>,
            'id' | 'kind' | 'title' | 'weight' | 'maximumMarks' | 'dueAt' | 'isOpenBook' | 'record' | 'class'
          >,
        ).toBe(true);
        // A union of models only gets the property names they all share (here, none)
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentPropertyName<_ModelA | _ModelB>, never>).toBe(true);
      });

      it('Gets string | number property names from the default model', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentPropertyName, string | number>).toBe(true);
      });

      it('Infers a model type', () => {
        type Assessment = JSONSchemaModelFragmentType<AssessmentModel, JSONSchemaFixtureCollection>;
        //   ^?
        expect(true satisfies AssertTypeAssignable<Assessment, object>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['title'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['weight'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['maximumMarks'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['dueAt'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['isOpenBook'], boolean>).toBe(true);
        // `AssessmentKind` is an integer constrained by a `oneOf`, which is not yet supported
        expect(true satisfies AssertTypeEquality<Assessment['kind'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['class'], _FixtureModel<'Class'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['class'] & {}, _FixtureModel<'Class'>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['record']['battery']['isProctored'], boolean>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['record']['register']['answeredByItem'], object>).toBe(true);
      });

      it('Infers nested model and array of model properties', () => {
        type Book = _FixtureModel<'Book'>;
        expect(true satisfies AssertTypeEquality<Book['authors'], Array<_FixtureModel<'Person'>>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Book['class'], _FixtureModel<'Class'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<_FixtureModel<'Class'>['code'], string>).toBe(true);
      });

      it('Does not carry the readonly modifier of schema properties over to model properties', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaModelFragmentType<_ModelA>, { a: number }>).toBe(true);
        // @ts-expect-error `as const` schema properties are readonly, but the inferred model properties are not
        expect(true satisfies AssertTypeEquality<JSONSchemaModelFragmentType<_ModelA>, { readonly a: number }>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: { type: 'number' } } }>, { a: number }>).toBe(
          true,
        );
      });

      it('Does not carry the optional modifier of schema properties over to model properties', () => {
        type Model = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a?: { type: 'number' } } }>;
        expect(true satisfies AssertTypeEquality<Model, { a: number }>).toBe(true);
        // @ts-expect-error an optional schema property still infers a required model property
        expect(true satisfies AssertTypeEquality<Model, { a?: number }>).toBe(true);
      });

      it('Infers unknown from a model with boolean schema properties', () => {
        // TODO: `JSONSchemaModelFragment` requires every property to be a schema object, so boolean schemas (valid JSON schema) are not yet supported
        type Model = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: true; b: false } }>;
        expect(true satisfies AssertTypeEquality<Model, unknown>).toBe(true);
      });

      it('Infers unknown from a non-model', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaModelFragmentType<{ type: 'string' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly properties: { readonly a: { readonly type: 'string' } } }>, unknown>).toBe(
          true,
        );
      });
    });
  });
});
