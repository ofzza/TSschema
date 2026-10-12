import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentNode, JSONSchemaConstFragmentNode } from './index.js';

import { default as constJsonSchema } from '../../../res/sidecar/const.json';

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Const fragment', () => {
      it('Detects a const', () => {
        expect(JSONSchemaConstFragmentNode.is({ const: 123 })).toBe(true);
        expect(JSONSchemaConstFragmentNode.is(constJsonSchema.$defs.Const)).toBe(true);
        // A `const` of any value, `null` and `undefined` included, is a const
        expect(JSONSchemaConstFragmentNode.is({ const: null })).toBe(true);
        expect(JSONSchemaConstFragmentNode.is({ const: undefined })).toBe(true);
      });

      it('Rejects a non-const', () => {
        expect(JSONSchemaConstFragmentNode.is({ type: 'number' })).toBe(false);
        expect(JSONSchemaConstFragmentNode.is({ enum: [123] })).toBe(false);
      });

      it('Parses the constant value of a const', () => {
        const constant = new JSONSchemaCollectionFragmentNode(constJsonSchema).$defs.Const[0];
        expect(constant).toBeInstanceOf(JSONSchemaConstFragmentNode);
        expect(constant.const).toBe(123);
        expect(true satisfies AssertTypeEquality<typeof constant.const, 123>).toBe(true);
      });

      it('Parses an object constant as declared', () => {
        const collection = new JSONSchemaCollectionFragmentNode({ $defs: { Point: { const: { x: 1, y: 2 } } } } as const);
        const point = collection.$defs.Point[0];
        expect(point.const).toEqual({ x: 1, y: 2 });
        expect(true satisfies AssertTypeEquality<typeof point.const, { readonly x: 1; readonly y: 2 }>).toBe(true);
      });

      it('Infers the type of a const', () => {
        const _constant = new JSONSchemaCollectionFragmentNode(constJsonSchema).$defs.Const[0];
        expect(true satisfies AssertTypeEquality<typeof _constant.Type, 123>).toBe(true);
      });
    });
  });
});
