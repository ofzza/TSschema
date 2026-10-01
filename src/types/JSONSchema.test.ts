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
} from './JSONSchema';

import type { default as schoolJsonSchema } from '../../res/school';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?
type AssessmentModel = JSONSchemaSchoolCollection['$defs']['Assessment'];
//   ^?

describe('JSONSchema', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('JSONSchemaPrimitiveTypeName', () => {
    expect(
      true satisfies AssertTypeEquality<
        JSONSchemaPrimitiveTypeName,
        'string' | 'number' | 'byte' | 'integer' | 'long' | 'float' | 'double' | 'boolean' | 'null'
      >,
    ).toBe(true);
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

    it('Model fragment', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsModel<AssessmentModel>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<AssessmentModel, JSONSchemaModelFragment>).toBe(true);
      // !FIXME: Test type inference
    });

    it('Const fragment', () => {
      const _const = { const: 123 } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsConst<typeof _const>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _const, JSONSchemaConstFragment>).toBe(true);
      // !FIXME: Test type inference
    });

    it('Enum fragment', () => {
      const _enum = { enum: ['a', 'b', 'c'] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsEnum<typeof _enum>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _enum, JSONSchemaEnumFragment>).toBe(true);
      // !FIXME: Test type inference
    });

    it('Primitive Type fragment', () => {
      const _primitiveType = { type: 'number' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsPrimitiveType<typeof _primitiveType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _primitiveType, JSONSchemaPrimitiveTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('Array Type fragment', () => {
      const _arrayType = { type: 'array' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsArrayType<typeof _arrayType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _arrayType, JSONSchemaArrayTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('Object Type fragment', () => {
      const _objectType = { type: 'object' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsObjectType<typeof _objectType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _objectType, JSONSchemaObjectTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });

    it('AllOf fragment', () => {
      const _allOfType = { allOf: [{ type: 'number' }] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAllOfType<typeof _allOfType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _allOfType, JSONSchemaAllOfTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('AnyOf fragment', () => {
      const _anyOfType = { anyOf: [{ type: 'number' }] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsAnyOfType<typeof _anyOfType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _anyOfType, JSONSchemaAnyOfTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('OneOf fragment', () => {
      const _oneOfType = { oneOf: [{ type: 'number' }] } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<typeof _oneOfType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _oneOfType, JSONSchemaOneOfTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });
    it('Not fragment', () => {
      const _notType = { not: { type: 'number' } } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotType<typeof _notType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _notType, JSONSchemaNotTypeFragment>).toBe(true);
      // !FIXME: Test type inference
    });

    it('$Ref fragment', () => {
      const _refType = { $ref: '#/...' } as const;
      //    ^?
      expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsReference<typeof _refType>, true>).toBe(true);
      expect(true satisfies AssertTypeAssignable<typeof _refType, JSONSchemaReferenceFragment>).toBe(true);
      // !FIXME: Test type inference
    });
  });
});
