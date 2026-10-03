import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaConstFragment, JSONSchemaConstFragmentType, JSONSchemaFragmentIsConst } from './index.js';

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

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
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
  });
});
