import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaEnumFragment, JSONSchemaEnumFragmentType, JSONSchemaFragmentIsEnum } from './index.js';

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

describe('JSONSchema', () => {
  // Type layer tests of EnumFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a single
  // file; src/reflection/JSONSchema/EnumFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Enum fragment', () => {
      // JSONSchemaEnumFragment / JSONSchemaFragmentIsEnum and the value type JSONSchemaEnumFragmentType, the union of the enumerated values. Tested at type
      // level only, on the Enum definition of the res/enum.json fixture (a const of res/const.json as the negative) and on inline fragments with mixed and
      // `null` values and a widened (non tuple) `enum` array, by AssertTypeEquality and AssertTypeAssignable.
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
        // An absent keyword infers `unknown`, so it is neutral in JSONSchemaFragmentType's intersection of every per-keyword type.
        // See AGENTS.md › JSON schema type inference uses `unknown` for "no constraint".
        expect(true satisfies AssertTypeEquality<JSONSchemaEnumFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });
  });
});
