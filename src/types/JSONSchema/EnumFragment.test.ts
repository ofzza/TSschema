import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaEnumFragment, JSONSchemaEnumFragmentType, JSONSchemaFragmentIsEnum } from './index.js';

import type { default as constJsonSchema } from '../../../res/const.js';
type JSONSchemaConstCollection = typeof constJsonSchema;
//   ^?
type JSONSchemaConst = JSONSchemaConstCollection['$defs']['Const'];
//   ^?

import type { default as enumJsonSchema } from '../../../res/enum.js';
type JSONSchemaEnumCollection = typeof enumJsonSchema;
//   ^?
type JSONSchemaEnum = JSONSchemaEnumCollection['$defs']['Enum'];
//   ^?

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
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
  });
});
