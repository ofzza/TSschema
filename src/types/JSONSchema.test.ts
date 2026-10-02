import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable, AssertTypeUnassignable, AssertTypeInequality } from '@ofzza/TSstd';
import {
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
  JSONSchemaFragmentIsArrayType,
  JSONSchemaFragmentIsCollection,
  JSONSchemaFragmentIsConst,
  JSONSchemaFragmentIsEnum,
  JSONSchemaFragmentIsModel,
  JSONSchemaFragmentIsNotCollection,
  JSONSchemaFragmentIsAllOfType,
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
  JSONSchemaAllOfTypeFragment,
  JSONSchemaPrimitiveType,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaPrimitiveTypeFromName,
  JSONSchemaPrimitiveTypeName,
  JSONSchemaFragmentIsObjectType,
  JSONSchemaObjectTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaFragmentIsAnyOfType,
  JSONSchemaFragmentIsNotType,
  JSONSchemaNotTypeFragment,
  JSONSchemaFragmentIsOneOfType,
  JSONSchemaOneOfTypeFragment,
  JSONSchemaFragmentIsReference,
  JSONSchemaReferenceFragment,
  JSONSchemaPrimitiveTypeFragmentType,
  JSONSchemaArrayTypeFragmentType,
  JSONSchemaFragmentType,
  JSONSchemaObjectTypeFragmentType,
  JSONSchemaConstFragmentType,
  JSONSchemaEnumFragmentType,
  JSONSchemaReferenceFragmentType,
  JSONSchemaAnyOfTypeFragmentType,
} from './JSONSchema';

import type { default as constJsonSchema } from '../../res/const';
type JSONSchemaConstCollection = typeof constJsonSchema;
//   ^?
type JSONSchemaConst = JSONSchemaConstCollection['$defs']['Const'];
//   ^?

import type { default as enumJsonSchema } from '../../res/enum';
type JSONSchemaEnumCollection = typeof enumJsonSchema;
//   ^?
type JSONSchemaEnum = JSONSchemaEnumCollection['$defs']['Enum'];
//   ^?

import type { default as schoolJsonSchema } from '../../res/school';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type AssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];

// !FIXME: Remove, just for during-development testing
type _Assessment = JSONSchemaFragmentType<JSONSchemaSchoolCollection['$defs']['Assessment'], JSONSchemaSchoolCollection>;
//   ^?
type _AssessmentKind = JSONSchemaFragmentType<JSONSchemaSchoolCollection['$defs']['AssessmentKind']>;
//   ^?

describe('JSONSchema', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('JSONSchemaPrimitiveTypeName', () => {
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeName, 'string' | 'boolean' | 'number' | 'integer' | 'null'>).toBe(true);
  });

  it('JSONSchemaPrimitiveType', () => {
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveType, string | number | boolean | null>).toBe(true);
  });

  it('JSONSchemaPrimitiveType', () => {
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string'>, string>).toBe(true);
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'number'>, number>).toBe(true);
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'integer'>, number>).toBe(true);
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'boolean'>, boolean>).toBe(true);
    expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'null'>, null>).toBe(true);
  });

  describe('JSONSchema fragments', () => {
    it('Collection fragment', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsCollection<JSONSchemaSchoolCollection>, true>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotCollection<JSONSchemaSchoolCollection>, false>).toBe(true);
      expect(true satisfies AssertTypeAssignable<JSONSchemaSchoolCollection, JSONSchemaCollection>).toBe(true);
      expect(true satisfies AssertTypeUnassignable<JSONSchemaSchoolCollection, JSONSchemaNotCollectionFragment>).toBe(true);
    });

    it('Non-collection fragment', () => {
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

      const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>['id'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>['title'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>['weight'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>['maximumMarks'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>['dueAt'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>['isOpenBook'], boolean>).toBe(true);
    });

    it('Model fragment', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<AssessmentModel>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<AssessmentModel, JSONSchemaModelFragment>).toBe(true);

      // !FIXME: Test type inference
    });

    it('Const fragment', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsConst<JSONSchemaConst>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<JSONSchemaConst, JSONSchemaConstFragment>).toBe(true);

      expect(true satisfies AssertTypeEquality<JSONSchemaConstFragmentType<JSONSchemaConst>, 123>).toBe(true);
    });

    it('Enum fragment', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsEnum<JSONSchemaEnum>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<JSONSchemaEnum, JSONSchemaEnumFragment>).toBe(true);

      expect(true satisfies AssertTypeEquality<JSONSchemaEnumFragmentType<JSONSchemaEnum>, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
    });

    it('Primitive Type fragment', () => {
      const _primitiveTypeFragment = { type: 'number' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<typeof _primitiveTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _primitiveTypeFragment, JSONSchemaPrimitiveTypeFragment>).toBe(true);

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
    it('Array Type fragment', () => {
      const _arrayTypeFragment = { type: 'array' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<typeof _arrayTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _arrayTypeFragment, JSONSchemaArrayTypeFragment>).toBe(true);

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
    });
    it('Object Type fragment', () => {
      const _objectTypeFragment = { type: 'object' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<typeof _objectTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _objectTypeFragment, JSONSchemaObjectTypeFragment>).toBe(true);

      expect(true satisfies AssertTypeEquality<JSONSchemaObjectTypeFragmentType<typeof _objectTypeFragment>, object>).toBe(true);
    });

    it('AllOf fragment', () => {
      const _allOfTypeFragment = { allOf: [{ type: 'number' }] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAllOfType<typeof _allOfTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _allOfTypeFragment, JSONSchemaAllOfTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('AnyOf fragment', () => {
      const _anyOfTypeFragment = { anyOf: [{ type: 'number' }] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAnyOfType<typeof _anyOfTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _anyOfTypeFragment, JSONSchemaAnyOfTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('OneOf fragment', () => {
      const _oneOfTypeFragment = { oneOf: [{ type: 'number' }] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<typeof _oneOfTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _oneOfTypeFragment, JSONSchemaOneOfTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('Not fragment', () => {
      const _notTypeFragment = { not: { type: 'number' } } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotType<typeof _notTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _notTypeFragment, JSONSchemaNotTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });

    it('$Ref fragment', () => {
      const _refTypeFragment = { $ref: '#/$defs/Assessment' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<typeof _refTypeFragment>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _refTypeFragment, JSONSchemaReferenceFragment>).toBe(true);

      type AssessmentType = JSONSchemaReferenceFragmentType<typeof _refTypeFragment, JSONSchemaSchoolCollection>;
      //   ^?
      expect(true satisfies AssertTypeAssignable<AssessmentType, object>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['id'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['title'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['weight'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['maximumMarks'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['dueAt'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<AssessmentType['isOpenBook'], boolean>).toBe(true);

      type AssessmentKindType = JSONSchemaReferenceFragmentType<AssessmentModel['properties']['kind'], JSONSchemaSchoolCollection>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentType['kind'], AssessmentKindType>).toBe(true);
      // !FIXME: Test type inference

      type ClassType = JSONSchemaAnyOfTypeFragmentType<AssessmentModel['properties']['class'], JSONSchemaSchoolCollection>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentType['class'], ClassType>).toBe(true);
      // !FIXME: Test type inference

      type RecordType = JSONSchemaReferenceFragmentType<AssessmentModel['properties']['record'], JSONSchemaSchoolCollection>;
      //   ^?
      expect(true satisfies AssertTypeEquality<AssessmentType['record'], RecordType>).toBe(true);
      // !FIXME: Test type inference
    });
  });
});
