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
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } }; readonly required: readonly ['a'] };
/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelB = { readonly type: 'object'; readonly properties: { readonly b: { readonly type: 'string' } }; readonly required: readonly ['b'] };

describe('JSONSchema', () => {
  // Type layer tests of ModelFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a single
  // file; src/reflection/JSONSchema/ModelFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Model fragment', () => {
      // JSONSchemaModelFragment / JSONSchemaFragmentIsModel, the JSONSchemaFragmentPropertyName utility and the value type JSONSchemaModelFragmentType,
      // inferred from a `type: 'object'` fragment with `properties`. Tested at type level only, on models of the res/schema.json fixture and on inline
      // fragments (both `as const`-style readonly and plain, to tell the schema literal's modifiers apart from what `required` says), by AssertTypeEquality and
      // AssertTypeAssignable, with `@ts-expect-error` negatives for the modifiers a model must not infer.
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
        // Property types are compared one by one, the optional ones through `Pick` (keeping them optional) and `class` also through `& {}` (dropping
        // `undefined` and `null`), as the whole recursive model type can not be spelled out.
        type Assessment = JSONSchemaModelFragmentType<AssessmentModel, JSONSchemaFixtureCollection>;
        //   ^?
        expect(true satisfies AssertTypeAssignable<Assessment, object>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['title'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['weight'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['maximumMarks'], number>).toBe(true);
        // `dueAt` is listed in `required` but nullable: required in the model, yet its type includes `null`
        expect(true satisfies AssertTypeEquality<Assessment['dueAt'], string | null>).toBe(true);
        // `kind`, `isOpenBook` and `class` are not listed in `required`, so they are the optional ones
        expect(true satisfies AssertTypeEquality<Pick<Assessment, 'isOpenBook'>, { isOpenBook?: boolean }>).toBe(true);
        // `AssessmentKind` is an integer constrained by a `oneOf` of `const`s
        expect(true satisfies AssertTypeEquality<Pick<Assessment, 'kind'>, { kind?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 }>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Assessment, 'class'>, { class?: _FixtureModel<'Class'> | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['class'] & {}, _FixtureModel<'Class'>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['record']['battery']['isProctored'], boolean>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['record']['register']['answeredByItem'], object>).toBe(true);
      });

      it('Infers nested model and array of model properties', () => {
        type Book = _FixtureModel<'Book'>;
        expect(true satisfies AssertTypeEquality<Book['authors'], Array<_FixtureModel<'Person'>> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Book, 'class'>, { class?: _FixtureModel<'Class'> | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<_FixtureModel<'Class'>['code'], string>).toBe(true);
      });

      it('Does not carry the readonly modifier of schema properties over to model properties', () => {
        // See AGENTS.md › A homomorphic mapped type over a schema object copies the schema literal's modifiers.
        expect(true satisfies AssertTypeEquality<JSONSchemaModelFragmentType<_ModelA>, { a: number }>).toBe(true);
        // @ts-expect-error `as const` schema properties are readonly, but the inferred model properties are not
        expect(true satisfies AssertTypeEquality<JSONSchemaModelFragmentType<_ModelA>, { readonly a: number }>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: { type: 'number' } }; required: ['a'] }>,
            { a: number }
          >,
        ).toBe(true);
      });

      it('Does not carry the optional modifier of schema properties over to model properties', () => {
        // An optional key also adds `undefined` to the property's schema, which must be excluded before it is matched as a fragment.
        // See AGENTS.md › A homomorphic mapped type over a schema object copies the schema literal's modifiers.
        type Model = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a?: { type: 'number' } }; required: ['a'] }>;
        expect(true satisfies AssertTypeEquality<Model, { a: number }>).toBe(true);
        // @ts-expect-error an optional schema property listed in `required` still infers a required model property
        expect(true satisfies AssertTypeEquality<Model, { a?: number }>).toBe(true);
      });

      it('Infers properties listed in required as required, and all other properties as optional', () => {
        // See AGENTS.md › Model properties are optional unless listed in `required`, as in JSON Schema.
        type Model = JSONSchemaModelFragmentType<{
          readonly type: 'object';
          readonly properties: { readonly a: { readonly type: 'number' }; readonly b: { readonly type: 'string' } };
          readonly required: readonly ['a'];
        }>;
        //   ^?
        expect(true satisfies AssertTypeEquality<Model, { a: number; b?: string }>).toBe(true);
        // @ts-expect-error a property not listed in `required` is optional
        expect(true satisfies AssertTypeEquality<Model, { a: number; b: string }>).toBe(true);
      });

      it('Infers required, optional and nullable properties of every kind independently of each other', () => {
        // Being required (listed in `required`) and being nullable (a `null` type or `anyOf` member) are independent, so the fixture has every combination of
        // the two, for primitives, references (to models and to enums), arrays (with nullable items, too) and records. Optional properties are compared
        // through `Pick`, keeping them optional.
        type Battery = _FixtureModel<'NullableScalarBattery'>;
        expect(true satisfies AssertTypeEquality<Battery['isProctored'], boolean | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Battery, 'curveAdjustment'>, { curveAdjustment?: number | null }>).toBe(true);

        type Series = _FixtureModel<'NullableScalarSeries'>;
        expect(true satisfies AssertTypeEquality<Series['attemptedFlags'], Array<boolean | null>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Series['rawScores'], Array<number | null> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Series, 'curveAdjustments'>, { curveAdjustments?: Array<number | null> }>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Series, 'seatNumbers'>, { seatNumbers?: Array<number | null> | null }>).toBe(true);
        // A `byte[]` is written as a base64 string (`contentEncoding` is not inferred from)
        expect(true satisfies AssertTypeEquality<_FixtureModel<'ScalarSeries'>['answerSheetScan'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Series['answerSheetScan'], string | null>).toBe(true);

        // Records are inferred as `object`, as `additionalProperties` is not supported yet
        type Register = _FixtureModel<'NullableScalarRegister'>;
        expect(true satisfies AssertTypeEquality<Register['answeredByItem'], object>).toBe(true);
        expect(true satisfies AssertTypeEquality<Register['rawScoreByItem'], object | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Register, 'seatByItem'>, { seatByItem?: object | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<_FixtureModel<'Library'>['catalogue'], object | null>).toBe(true);

        type Class = _FixtureModel<'Class'>;
        expect(true satisfies AssertTypeEquality<Class['professor'], _FixtureModel<'Person'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Class, 'room'>, { room?: _FixtureModel<'Room'> | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Class, 'schedule'>, { schedule?: Array<_FixtureModel<'ClassSession'>> | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Class, 'term'>, { term?: 0 | 1 | 2 | 3 | null }>).toBe(true);
        expect(true satisfies AssertTypeEquality<_FixtureModel<'Room'>['kind'], 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null>).toBe(true);
      });

      it('Infers every property as optional from a model with no or an empty required', () => {
        type Model = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: { type: 'number' }; b: { type: 'string' } } }>;
        expect(true satisfies AssertTypeEquality<Model, { a?: number; b?: string }>).toBe(true);
        type EmptyRequiredModel = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: { type: 'number' } }; required: [] }>;
        expect(true satisfies AssertTypeEquality<EmptyRequiredModel, { a?: number }>).toBe(true);
      });

      it('Infers every property as optional from a required which is not a list of literal names', () => {
        // A widened `string[]`, e.g. from a JSON import without a sidecar, names no property known to be required.
        // See AGENTS.md › Model properties are optional unless listed in `required`, as in JSON Schema.
        type Model = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: { type: 'number' } }; required: string[] }>;
        expect(true satisfies AssertTypeEquality<Model, { a?: number }>).toBe(true);
      });

      it('Ignores required names the model does not define', () => {
        type Model = JSONSchemaModelFragmentType<{ type: 'object'; properties: { a: { type: 'number' } }; required: ['a', 'b'] }>;
        expect(true satisfies AssertTypeEquality<Model, { a: number }>).toBe(true);
      });

      it('Infers a property required by any model of an allOf as required', () => {
        // Compared by assignability both ways, as the inferred intersection of the two model types is not AssertTypeEquality-equal to the equivalent single
        // object type.
        type Model = JSONSchemaFragmentType<{
          allOf: [
            { type: 'object'; properties: { a: { type: 'number' }; b: { type: 'string' } }; required: ['a'] },
            { type: 'object'; properties: { b: { type: 'string' } }; required: ['b'] },
          ];
        }>;
        expect(true satisfies AssertTypeAssignable<{ a: number; b: string }, Model>).toBe(true);
        expect(true satisfies AssertTypeAssignable<Model, { a: number; b: string }>).toBe(true);
      });

      it('Keeps the required properties of the model branch of a nullable model', () => {
        // The branches of a type array keep every other keyword, `required` included.
        type Model = JSONSchemaFragmentType<{ type: ['object', 'null']; properties: { a: { type: 'number' }; b: { type: 'string' } }; required: ['a'] }>;
        expect(true satisfies AssertTypeEquality<Model, { a: number; b?: string } | null>).toBe(true);
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
