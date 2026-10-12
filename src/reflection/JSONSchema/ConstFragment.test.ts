import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaConstFragmentFacet } from './index.js';

import { default as constJsonSchema } from '../../../res/sidecar/const.json';

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Const fragment', () => {
      it('Detects a const', () => {
        expect(JSONSchemaConstFragmentFacet.is({ const: 123 })).toBe(true);
        expect(JSONSchemaConstFragmentFacet.is(constJsonSchema.$defs.Const)).toBe(true);
        // A `const` of any value, `null` and `undefined` included, is a const
        expect(JSONSchemaConstFragmentFacet.is({ const: null })).toBe(true);
        expect(JSONSchemaConstFragmentFacet.is({ const: undefined })).toBe(true);
      });

      it('Rejects a non-const', () => {
        expect(JSONSchemaConstFragmentFacet.is({ type: 'number' })).toBe(false);
        expect(JSONSchemaConstFragmentFacet.is({ enum: [123] })).toBe(false);
      });

      it('Parses the constant value of a const', () => {
        const constant = new JSONSchemaCollectionFragmentFacet(constJsonSchema).$defs.Const[0];
        expect(constant).toBeInstanceOf(JSONSchemaConstFragmentFacet);
        expect(constant.const).toBe(123);
        expect(true satisfies AssertTypeEquality<typeof constant.const, 123>).toBe(true);
      });

      it('Parses an object constant as declared', () => {
        const collection = new JSONSchemaCollectionFragmentFacet({ $defs: { Point: { const: { x: 1, y: 2 } } } } as const);
        const point = collection.$defs.Point[0];
        expect(point.const).toEqual({ x: 1, y: 2 });
        expect(true satisfies AssertTypeEquality<typeof point.const, { readonly x: 1; readonly y: 2 }>).toBe(true);
      });

      it('Infers the type of a const', () => {
        const _constant = new JSONSchemaCollectionFragmentFacet(constJsonSchema).$defs.Const[0];
        expect(true satisfies AssertTypeEquality<typeof _constant.Type, 123>).toBe(true);
      });
    });
  });
});
