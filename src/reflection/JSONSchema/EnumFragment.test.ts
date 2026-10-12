import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaEnumFragmentReflect } from './index.js';

import { default as enumJsonSchema } from '../../../res/sidecar/enum.json';

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Enum fragment', () => {
      it('Detects an enum', () => {
        expect(JSONSchemaEnumFragmentReflect.check({ enum: ['a', 'b'] })).toBe(true);
        expect(JSONSchemaEnumFragmentReflect.check(enumJsonSchema.$defs.Enum)).toBe(true);
        expect(JSONSchemaEnumFragmentReflect.check({ enum: [] })).toBe(true);
      });

      it('Rejects a non-enum', () => {
        expect(JSONSchemaEnumFragmentReflect.check({ type: 'string' })).toBe(false);
        expect(JSONSchemaEnumFragmentReflect.check({ const: 'a' })).toBe(false);
        expect(JSONSchemaEnumFragmentReflect.check({ enum: 'a' } as any)).toBe(false);
      });

      it('Reflects the enumerated values of an enum', () => {
        const enumeration = new JSONSchemaCollectionFragmentReflect(enumJsonSchema).$defs.Enum[0];
        expect(enumeration).toBeInstanceOf(JSONSchemaEnumFragmentReflect);
        expect(enumeration.enum).toEqual(['Aaa', 'Bbb', 'Ccc']);
        expect(true satisfies AssertTypeEquality<(typeof enumeration.enum)[number], 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });

      it('Infers the type of an enum', () => {
        const _enumeration = new JSONSchemaCollectionFragmentReflect(enumJsonSchema).$defs.Enum[0];
        expect(true satisfies AssertTypeEquality<typeof _enumeration.Type, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });
    });
  });
});
