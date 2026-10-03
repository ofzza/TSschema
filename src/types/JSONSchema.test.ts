import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable, AssertTypeUnassignable, AssertTypeInequality } from '@ofzza/tsstd';
import type {
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAllOfTypeFragmentType,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaAnyOfTypeFragmentType,
  JSONSchemaArrayTypeFragment,
  JSONSchemaArrayTypeFragmentType,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaConstFragmentType,
  JSONSchemaEnumFragment,
  JSONSchemaEnumFragmentType,
  JSONSchemaFragmentIsAllOfType,
  JSONSchemaFragmentIsAnyOfType,
  JSONSchemaFragmentIsArrayType,
  JSONSchemaFragmentIsCollection,
  JSONSchemaFragmentIsConst,
  JSONSchemaFragmentIsEnum,
  JSONSchemaFragmentIsModel,
  JSONSchemaFragmentIsNotCollection,
  JSONSchemaFragmentIsNotType,
  JSONSchemaFragmentIsObjectType,
  JSONSchemaFragmentIsOneOfType,
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaFragmentIsReference,
  JSONSchemaFragmentType,
  JSONSchemaModelFragment,
  JSONSchemaModelFragmentType,
  JSONSchemaNotCollectionFragment,
  JSONSchemaNotTypeFragment,
  JSONSchemaNotTypeFragmentType,
  JSONSchemaObjectTypeFragment,
  JSONSchemaObjectTypeFragmentType,
  JSONSchemaOneOfTypeFragment,
  JSONSchemaOneOfTypeFragmentType,
  JSONSchemaPrimitiveType,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaPrimitiveTypeFragmentType,
  JSONSchemaPrimitiveTypeFromName,
  JSONSchemaPrimitiveTypeName,
  JSONSchemaReferenceFragment,
  JSONSchemaReferenceFragmentType,
} from './JSONSchema.js';

import type { default as constJsonSchema } from '../../res/const.js';
type JSONSchemaConstCollection = typeof constJsonSchema;
//   ^?
type JSONSchemaConst = JSONSchemaConstCollection['$defs']['Const'];
//   ^?

import type { default as enumJsonSchema } from '../../res/enum.js';
type JSONSchemaEnumCollection = typeof enumJsonSchema;
//   ^?
type JSONSchemaEnum = JSONSchemaEnumCollection['$defs']['Enum'];
//   ^?

import type { default as schoolJsonSchema } from '../../res/school.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type AssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];

/**
 * Infers the type of a model definition from the school schema collection, addressed by name
 */
type _SchoolModel<TName extends string> = JSONSchemaFragmentType<{ readonly $ref: `#/$defs/${TName}` }, JSONSchemaSchoolCollection>;

/**
 * Self-referencing schema collection: a tree of nodes
 */
type _JSONSchemaTreeCollection = {
  readonly $defs: {
    readonly Node: {
      readonly type: 'object';
      readonly properties: {
        readonly value: { readonly type: 'string' };
        readonly children: { readonly type: 'array'; readonly items: { readonly $ref: '#/$defs/Node' } };
      };
    };
  };
};

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } } };
/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelB = { readonly type: 'object'; readonly properties: { readonly b: { readonly type: 'string' } } };

describe('JSONSchema', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  describe('Primitive types', () => {
    it('Lists all primitive type names', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeName, 'string' | 'boolean' | 'number' | 'integer' | 'null'>).toBe(true);
    });

    it('Lists all primitive value types', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveType, string | number | boolean | null>).toBe(true);
    });

    it('Maps primitive type names to their types', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string'>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'number'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'integer'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'boolean'>, boolean>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'null'>, null>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string' | 'null'>, string | null>).toBe(true);
    });
  });

  describe('JSONSchema fragments', () => {
    describe('Collection fragment', () => {
      it('Detects a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<JSONSchemaSchoolCollection>, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<JSONSchemaSchoolCollection>, false>).toBe(true);
        expect(true satisfies AssertTypeAssignable<JSONSchemaSchoolCollection, JSONSchemaCollection>).toBe(true);
        expect(true satisfies AssertTypeUnassignable<JSONSchemaSchoolCollection, JSONSchemaNotCollectionFragment>).toBe(true);
      });

      it('Detects a non-collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<AssessmentModel>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<AssessmentModel>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<AssessmentModel, JSONSchemaNotCollectionFragment>).toBe(true);
      });

      it('Rejects every fragment kind for a collection', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<JSONSchemaSchoolCollection>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<{ $defs: {}; $ref: '#/$defs/A' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ $defs: {}; type: 'string' }>, false>).toBe(true);
      });
    });

    describe('Any fragment', () => {
      it('Infers a type from a fragment of any kind', () => {
        const _primitiveTypeFragment = { type: 'number' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _primitiveTypeFragment>, number>).toBe(true);

        const _arrayNumberTypeFragment = { type: 'array', items: { type: 'number' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _arrayNumberTypeFragment>, number[]>).toBe(true);
        const _arrayNumberArrayTypeFragment = { type: 'array', items: { type: 'array', items: { type: 'number' } } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _arrayNumberArrayTypeFragment>, number[][]>).toBe(true);

        const _objectTypeFragment = { type: 'object' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _objectTypeFragment>, object>).toBe(true);
        const _arrayObjectArrayTypeFragment = { type: 'array', items: { type: 'array', items: { type: 'object' } } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _arrayObjectArrayTypeFragment>, object[][]>).toBe(true);

        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<JSONSchemaConst>, 123>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<JSONSchemaEnum>, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);

        const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
        type Assessment = JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>;
        expect(true satisfies AssertTypeEquality<Assessment['id'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['weight'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['isOpenBook'], boolean>).toBe(true);
      });

      it('Infers unknown from an empty fragment', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{}>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly title: 'Anything' }>, unknown>).toBe(true);
      });

      it('Infers a union of types from a union of fragments', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'string' } | { readonly type: 'number' }>, string | number>).toBe(
          true,
        );
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'string' } | _ModelA>, string | { a: number }>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly const: 1 } | { readonly enum: readonly [2, 3] }>, 1 | 2 | 3>).toBe(true);
      });

      it('Intersects the types of sibling keywords', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'string'; readonly enum: readonly ['a', 1] }>, 'a'>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'integer'; readonly const: 1 }>, 1>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'string'; readonly const: 1 }>, never>).toBe(true);
      });
    });

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

      it('Infers a model type', () => {
        type Assessment = JSONSchemaModelFragmentType<AssessmentModel, JSONSchemaSchoolCollection>;
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
        expect(true satisfies AssertTypeEquality<Assessment['class'], _SchoolModel<'Class'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['class'] & {}, _SchoolModel<'Class'>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['record']['battery']['isProctored'], boolean>).toBe(true);
        expect(true satisfies AssertTypeEquality<Assessment['record']['register']['answeredByItem'], object>).toBe(true);
      });

      it('Infers nested model and array of model properties', () => {
        type Book = _SchoolModel<'Book'>;
        expect(true satisfies AssertTypeEquality<Book['authors'], Array<_SchoolModel<'Person'>>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Book['class'], _SchoolModel<'Class'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<_SchoolModel<'Class'>['code'], string>).toBe(true);
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

    describe('Const fragment', () => {
      it('Detects a const', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsConst<JSONSchemaConst>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<JSONSchemaConst, JSONSchemaConstFragment>).toBe(true);
      });

      it('Rejects a non-const', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsConst<JSONSchemaEnum>, false>).toBe(true);
      });

      it('Infers a const type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaConstFragmentType<JSONSchemaConst>, 123>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaConstFragmentType<{ readonly const: null }>, null>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaConstFragmentType<{ readonly const: readonly [1, 2] }>, readonly [1, 2]>).toBe(true);
      });

      it('Infers unknown from a non-const', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaConstFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });

    describe('Enum fragment', () => {
      it('Detects an enum', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsEnum<JSONSchemaEnum>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<JSONSchemaEnum, JSONSchemaEnumFragment>).toBe(true);
      });

      it('Rejects a non-enum', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsEnum<JSONSchemaConst>, false>).toBe(true);
      });

      it('Infers an enum type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaEnumFragmentType<JSONSchemaEnum>, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaEnumFragmentType<{ readonly enum: readonly ['a', 1, null] }>, 'a' | 1 | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaEnumFragmentType<{ enum: Array<'x' | 'y'> }>, 'x' | 'y'>).toBe(true);
      });

      it('Infers unknown from a non-enum', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaEnumFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });

    describe('Primitive Type fragment', () => {
      it('Detects a primitive type', () => {
        const _primitiveTypeFragment = { type: 'number' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<typeof _primitiveTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _primitiveTypeFragment, JSONSchemaPrimitiveTypeFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'null'] }>, true>).toBe(true);
      });

      it('Rejects a non-primitive type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'array' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<{ readonly type: readonly ['string', 'object'] }>, false>).toBe(true);
      });

      it('Infers a primitive type', () => {
        const _primitiveStringTypeFragment = { type: 'string' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveStringTypeFragment>, string>).toBe(true);
        const _primitiveBooleanTypeFragment = { type: 'boolean' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveBooleanTypeFragment>, boolean>).toBe(true);
        const _primitiveNumberTypeFragment = { type: 'number' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveNumberTypeFragment>, number>).toBe(true);
        const _primitiveIntegerTypeFragment = { type: 'integer' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveIntegerTypeFragment>, number>).toBe(true);
        const _primitiveNullTypeFragment = { type: 'null' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _primitiveNullTypeFragment>, null>).toBe(true);
      });

      it('Infers a union of primitive types from an array of type names', () => {
        const _nullableStringTypeFragment = { type: ['string', 'null'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<typeof _nullableStringTypeFragment>, string | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _nullableStringTypeFragment>, string | null>).toBe(true);
        const _numberOrBooleanTypeFragment = { type: ['integer', 'boolean'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _numberOrBooleanTypeFragment>, number | boolean>).toBe(true);
      });

      it('Infers unknown from an array of type names including non-primitive types', () => {
        const _stringOrObjectTypeFragment = { type: ['string', 'object'] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _stringOrObjectTypeFragment>, unknown>).toBe(true);
      });

      it('Infers unknown from a non-primitive type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ type: 'array' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFragmentType<{ const: 1 }>, unknown>).toBe(true);
      });
    });

    describe('Array Type fragment', () => {
      it('Detects an array type', () => {
        const _arrayTypeFragment = { type: 'array' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<typeof _arrayTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _arrayTypeFragment, JSONSchemaArrayTypeFragment>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentIsArrayType<{ readonly type: 'array'; readonly items: readonly [{ readonly type: 'string' }] }>,
            true
          >,
        ).toBe(true);
      });

      it('Rejects a non-array type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<{ type: 'object' }>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<{ items: { type: 'string' } }>, false>).toBe(true);
      });

      it('Infers an array type', () => {
        const _arrayTypeFragment = { type: 'array' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayTypeFragment>, Array<unknown>>).toBe(true);
        const _arrayStringTypeFragment = { type: 'array', items: { type: 'string' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayStringTypeFragment>, Array<string>>).toBe(true);
        const _arrayBooleanTypeFragment = { type: 'array', items: { type: 'boolean' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayBooleanTypeFragment>, Array<boolean>>).toBe(true);
        const _arrayNumberTypeFragment = { type: 'array', items: { type: 'number' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayNumberTypeFragment>, Array<number>>).toBe(true);
        const _arrayIntegerTypeFragment = { type: 'array', items: { type: 'integer' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayIntegerTypeFragment>, Array<number>>).toBe(true);
        const _arrayNullTypeFragment = { type: 'array', items: { type: 'null' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayNullTypeFragment>, Array<null>>).toBe(true);
        const _arrayModelTypeFragment = { type: 'array', items: { type: 'object', properties: { a: { type: 'number' } } } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<typeof _arrayModelTypeFragment>, Array<{ a: number }>>).toBe(true);
      });

      it('Infers an array of unknown when items are not a single schema', () => {
        const _arrayTupleTypeFragment = { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _arrayTupleTypeFragment>, Array<unknown>>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly type: 'array'; readonly items: true }>, Array<unknown>>).toBe(true);
      });

      it('Infers unknown from a non-array type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaArrayTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });

    describe('Object Type fragment', () => {
      it('Detects an object type', () => {
        const _objectTypeFragment = { type: 'object' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<typeof _objectTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _objectTypeFragment, JSONSchemaObjectTypeFragment>).toBe(true);
      });

      it('Rejects a non-object type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<AssessmentModel>, false>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<{ type: 'array' }>, false>).toBe(true);
      });

      it('Infers an object type', () => {
        const _objectTypeFragment = { type: 'object' } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<typeof _objectTypeFragment>, object>).toBe(true);
      });

      it('Infers unknown from a non-object type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<AssessmentModel>, unknown>).toBe(true);
      });
    });

    describe('AllOf fragment', () => {
      it('Detects an all-of-types', () => {
        const _allOfTypeFragment = { allOf: [{ type: 'number' }, { const: 123 }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAllOfType<typeof _allOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _allOfTypeFragment, JSONSchemaAllOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAllOfType<{ anyOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers an all-of-types type', () => {
        const _allOfTypeFragment = { allOf: [{ type: 'number' }, { const: 123 }] } as const;
        type AllOfTypeFragmentType = JSONSchemaAllOfTypeFragmentType<typeof _allOfTypeFragment>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AllOfTypeFragmentType, 123>).toBe(true);
      });

      it('Infers the intersection of models', () => {
        type AllOfModels = JSONSchemaFragmentType<{ readonly allOf: readonly [_ModelA, _ModelB] }>;
        expect(true satisfies AssertTypeAssignable<AllOfModels, { a: number; b: string }>).toBe(true);
        expect(true satisfies AssertTypeAssignable<{ a: number; b: string }, AllOfModels>).toBe(true);
      });

      it('Infers never from conflicting types', () => {
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentType<{ readonly allOf: readonly [{ readonly type: 'string' }, { readonly type: 'number' }] }>,
            never
          >,
        ).toBe(true);
      });

      it('Infers a type from nested combinators', () => {
        type Nested = JSONSchemaFragmentType<{
          readonly allOf: readonly [{ readonly anyOf: readonly [{ readonly type: 'string' }, { readonly type: 'null' }] }, { readonly type: 'string' }];
        }>;
        expect(true satisfies AssertTypeEquality<Nested, string>).toBe(true);
      });

      it('Infers unknown from an empty all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly allOf: readonly [] }>, unknown>).toBe(true);
      });

      it('Infers the element type from a non-tuple all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAllOfTypeFragmentType<{ allOf: Array<{ type: 'string' }> }>, string>).toBe(true);
      });

      it('Infers unknown from a non-all-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAllOfTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });

    describe('AnyOf fragment', () => {
      it('Detects an any-of-types', () => {
        const _anyOfTypeFragment = { anyOf: [{ type: 'number' }, { type: 'string' }, { const: true }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAnyOfType<typeof _anyOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _anyOfTypeFragment, JSONSchemaAnyOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAnyOfType<{ allOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers an any-of-types type', () => {
        const _anyOfTypeFragment = { anyOf: [{ type: 'number' }, { type: 'string' }, { const: true }] } as const;
        type AnyOfTypeFragmentType = JSONSchemaAnyOfTypeFragmentType<typeof _anyOfTypeFragment>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AnyOfTypeFragmentType, number | string | true>).toBe(true);
      });

      it('Infers the union of models and other types', () => {
        expect(
          true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly anyOf: readonly [_ModelA, { readonly type: 'null' }] }>, { a: number } | null>,
        ).toBe(true);
      });

      it('Infers never from an empty any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<{ readonly anyOf: readonly [] }>, never>).toBe(true);
      });

      it('Infers the element type from a non-tuple any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAnyOfTypeFragmentType<{ anyOf: Array<{ type: 'string' } | { type: 'null' }> }>, string | null>).toBe(
          true,
        );
      });

      it('Infers unknown from a non-any-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaAnyOfTypeFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });

    describe('OneOf fragment', () => {
      it('Detects a one-of-types', () => {
        const _oneOfTypeFragment = { oneOf: [{ type: 'number' }, { type: 'string' }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<typeof _oneOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _oneOfTypeFragment, JSONSchemaOneOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-one-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<{ anyOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers unknown from a one-of-types, as it is not yet supported', () => {
        // TODO: Replace with real expectations once One-Of is supported
        const _oneOfTypeFragment = { oneOf: [{ type: 'number' }, { type: 'string' }] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaOneOfTypeFragmentType<typeof _oneOfTypeFragment>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _oneOfTypeFragment>, unknown>).toBe(true);
      });
    });

    describe('Not fragment', () => {
      it('Detects a not-type', () => {
        const _notTypeFragment = { not: { type: 'number' } } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotType<typeof _notTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _notTypeFragment, JSONSchemaNotTypeFragment>).toBe(true);
      });

      it('Rejects a non-not-type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotType<{ type: 'number' }>, false>).toBe(true);
      });

      it('Infers unknown from a not-type, as it is not yet supported', () => {
        // TODO: Replace with real expectations once Not is supported
        const _notTypeFragment = { not: { type: 'number' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaNotTypeFragmentType<typeof _notTypeFragment>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _notTypeFragment>, unknown>).toBe(true);
      });
    });

    describe('$Ref fragment', () => {
      it('Detects a reference', () => {
        const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<typeof _refTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _refTypeFragment, JSONSchemaReferenceFragment>).toBe(true);
      });

      it('Rejects a non-reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<AssessmentModel>, false>).toBe(true);
      });

      it('Resolves a reference against a collection', () => {
        const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
        type AssessmentType = JSONSchemaReferenceFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>;
        //   ^?
        expect(true satisfies AssertTypeEquality<AssessmentType, JSONSchemaModelFragmentType<AssessmentModel, JSONSchemaSchoolCollection>>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['id'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['kind'], number>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['class'], _SchoolModel<'Class'> | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<AssessmentType['record']['battery']['isProctored'], boolean>).toBe(true);
      });

      it('Intersects a reference with its sibling keywords', () => {
        type Address = JSONSchemaFragmentType<{ readonly $ref: '#/$defs/Address'; readonly type: 'object' }, JSONSchemaSchoolCollection>;
        expect(true satisfies AssertTypeEquality<Address['city'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Address['latitude'], number>).toBe(true);
      });

      it('Resolves a recursive reference', () => {
        type TreeNode = JSONSchemaFragmentType<{ readonly $ref: '#/$defs/Node' }, _JSONSchemaTreeCollection>;
        expect(true satisfies AssertTypeEquality<TreeNode['value'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<TreeNode['children'][number]['children'][number]['value'], string>).toBe(true);
      });

      it('Infers unknown from an unresolvable reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/$defs/Missing' }, JSONSchemaSchoolCollection>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/definitions/Address' }, JSONSchemaSchoolCollection>, unknown>).toBe(
          true,
        );
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ $ref: '#/$defs/Address' }>, unknown>).toBe(true);
      });

      it('Infers unknown from a non-reference', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaReferenceFragmentType<{ type: 'string' }, JSONSchemaSchoolCollection>, unknown>).toBe(true);
      });
    });
  });
});
