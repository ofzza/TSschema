import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType, JSONSchemaFragmentTypeBranch } from './index.js';

import type { default as constJsonSchema } from '../../../res/sidecar/const.json';
type JSONSchemaConstCollection = typeof constJsonSchema;
//   ^?
type JSONSchemaConst = JSONSchemaConstCollection['$defs']['Const'];
//   ^?

import type { default as enumJsonSchema } from '../../../res/sidecar/enum.json';
type JSONSchemaEnumCollection = typeof enumJsonSchema;
//   ^?
type JSONSchemaEnum = JSONSchemaEnumCollection['$defs']['Enum'];
//   ^?

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?

/**
 * Small model fragment, used as a building block in the tests below
 */
type _ModelA = { readonly type: 'object'; readonly properties: { readonly a: { readonly type: 'number' } } };

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
        type Assessment = JSONSchemaFragmentType<typeof _refTypeFragment, JSONSchemaFixtureCollection>;
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

      it('Infers a union of the types of the branches of a type array naming non primitive types', () => {
        type Mixed = JSONSchemaFragmentType<_TypeArrayCollection['$defs']['Mixed']>;
        expect(true satisfies AssertTypeEquality<Mixed, { a: number } | boolean[] | string | null>).toBe(true);
        type Node = JSONSchemaFragmentType<_TypeArrayCollection['$defs']['Node'], _TypeArrayCollection>;
        expect(true satisfies AssertTypeEquality<null extends Node ? true : false, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['value'], string>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['next'], Node>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['tags'], string[] | null>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['child'], { x: number } | null>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentType<{ readonly type: readonly ['object']; readonly properties: _ModelA['properties'] }>,
            { a: number }
          >,
        ).toBe(true);
      });

      it('Intersects every branch of a type array with the types of keywords applying regardless of type', () => {
        type Enumerated = { readonly type: readonly ['object', 'string']; readonly enum: readonly ['a', 1, null] };
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<Enumerated>, 'a'>).toBe(true);
      });
    });

    describe('Type array branches', () => {
      it('Splits a type array naming non primitive types into a branch per group of type names', () => {
        type Branch = JSONSchemaFragmentTypeBranch<{ readonly type: readonly ['object', 'array', 'string', 'boolean', 'null']; readonly title: 'x' }>;
        expect(
          true satisfies AssertTypeEquality<
            Branch,
            | { readonly type: 'object'; readonly title: 'x' }
            | { readonly type: 'array'; readonly title: 'x' }
            | { readonly type: 'null'; readonly title: 'x' }
            | { readonly type: Array<'string' | 'boolean'>; readonly title: 'x' }
          >,
        ).toBe(true);
      });

      it('Splits a type array naming null off its primitive types, e.g. a nullable primitive', () => {
        type Branch = JSONSchemaFragmentTypeBranch<{ readonly type: readonly ['string', 'null'] }>;
        expect(true satisfies AssertTypeEquality<Branch, { readonly type: Array<'string'> } | { readonly type: 'null' }>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentTypeBranch<{ readonly type: readonly ['null'] }>, { readonly type: 'null' }>).toBe(true);
      });

      it('Leaves a fragment with no type array naming non primitive types as is', () => {
        type Primitives = { readonly type: readonly ['string', 'boolean'] };
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentTypeBranch<Primitives>, Primitives>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentTypeBranch<_ModelA>, _ModelA>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentTypeBranch<{ readonly const: 1 }>, { readonly const: 1 }>).toBe(true);
      });
    });
  });
});
