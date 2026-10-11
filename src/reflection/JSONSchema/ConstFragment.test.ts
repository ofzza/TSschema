import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaConstFragmentReflect } from './index.js';

import { default as constJsonSchema } from '../../../res/sidecar/const.json';

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Const fragment', () => {
      it('Detects a const', () => {
        expect(JSONSchemaConstFragmentReflect.check({ const: 123 })).toBe(true);
        expect(JSONSchemaConstFragmentReflect.check(constJsonSchema.$defs.Const)).toBe(true);
        // A `const` of any value, `null` and `undefined` included, is a const
        expect(JSONSchemaConstFragmentReflect.check({ const: null })).toBe(true);
        expect(JSONSchemaConstFragmentReflect.check({ const: undefined })).toBe(true);
      });

      it('Rejects a non-const', () => {
        expect(JSONSchemaConstFragmentReflect.check({ type: 'number' })).toBe(false);
        expect(JSONSchemaConstFragmentReflect.check({ enum: [123] })).toBe(false);
      });

      it('Reflects the constant value of a const', () => {
        const constant = new JSONSchemaCollectionFragmentReflect(constJsonSchema).fragment('Const')[0];
        expect(constant).toBeInstanceOf(JSONSchemaConstFragmentReflect);
        expect(constant.const).toBe(123);
        expect(true satisfies AssertTypeEquality<typeof constant.const, 123>).toBe(true);
      });

      it('Reflects an object constant as declared', () => {
        const collection = new JSONSchemaCollectionFragmentReflect({ $defs: { Point: { const: { x: 1, y: 2 } } } } as const);
        const point = collection.fragment('Point')[0];
        expect(point.const).toEqual({ x: 1, y: 2 });
        expect(true satisfies AssertTypeEquality<typeof point.const, { readonly x: 1; readonly y: 2 }>).toBe(true);
      });

      it('Infers the type of a const', () => {
        const _constant = new JSONSchemaCollectionFragmentReflect(constJsonSchema).fragment('Const')[0];
        expect(true satisfies AssertTypeEquality<typeof _constant.Type, 123>).toBe(true);
      });
    });
  });
});
