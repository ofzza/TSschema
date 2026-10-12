import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentNode, JSONSchemaEnumFragmentNode } from './index.js';

import { default as enumJsonSchema } from '../../../res/sidecar/enum.json';

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Enum fragment', () => {
      it('Detects an enum', () => {
        expect(JSONSchemaEnumFragmentNode.is({ enum: ['a', 'b'] })).toBe(true);
        expect(JSONSchemaEnumFragmentNode.is(enumJsonSchema.$defs.Enum)).toBe(true);
        expect(JSONSchemaEnumFragmentNode.is({ enum: [] })).toBe(true);
      });

      it('Rejects a non-enum', () => {
        expect(JSONSchemaEnumFragmentNode.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaEnumFragmentNode.is({ const: 'a' })).toBe(false);
        expect(JSONSchemaEnumFragmentNode.is({ enum: 'a' } as any)).toBe(false);
      });

      it('Parses the enumerated values of an enum', () => {
        const enumeration = new JSONSchemaCollectionFragmentNode(enumJsonSchema).$defs.Enum[0];
        expect(enumeration).toBeInstanceOf(JSONSchemaEnumFragmentNode);
        expect(enumeration.enum).toEqual(['Aaa', 'Bbb', 'Ccc']);
        expect(true satisfies AssertTypeEquality<(typeof enumeration.enum)[number], 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });

      it('Infers the type of an enum', () => {
        const _enumeration = new JSONSchemaCollectionFragmentNode(enumJsonSchema).$defs.Enum[0];
        expect(true satisfies AssertTypeEquality<typeof _enumeration.Type, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });
    });
  });
});
