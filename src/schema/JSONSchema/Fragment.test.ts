import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType } from './index.js';

import type { default as constJsonSchema } from '../../../res/const.json';
type JSONSchemaConstCollection = typeof constJsonSchema;
//   ^?
type JSONSchemaConst = JSONSchemaConstCollection['$defs']['Const'];
//   ^?

import type { default as enumJsonSchema } from '../../../res/enum.json';
type JSONSchemaEnumCollection = typeof enumJsonSchema;
//   ^?
type JSONSchemaEnum = JSONSchemaEnumCollection['$defs']['Enum'];
//   ^?

import type { default as schoolJsonSchema } from '../../../res/school.json';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } } };

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
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
  });
});
