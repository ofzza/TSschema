import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaConstFragment, JSONSchemaConstFragmentType, JSONSchemaFragmentIsConst } from './index.js';

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
  // Type layer tests of ConstFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a single
  // file; src/reflection/JSONSchema/ConstFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Const fragment', () => {
      // JSONSchemaConstFragment / JSONSchemaFragmentIsConst and the value type JSONSchemaConstFragmentType. Tested at type level only, on the Const definition
      // of the res/const.json fixture (an enum of res/enum.json as the negative) and on inline fragments with `null` and tuple values, by AssertTypeEquality
      // and AssertTypeAssignable.
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
        // An absent keyword infers `unknown`, so it is neutral in JSONSchemaFragmentType's intersection of every per-keyword type.
        // See AGENTS.md › JSON schema type inference uses `unknown` for "no constraint".
        expect(true satisfies AssertTypeEquality<JSONSchemaConstFragmentType<{ type: 'string' }>, unknown>).toBe(true);
      });
    });
  });
});
