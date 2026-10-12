import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaEnumFragmentFacet } from './index.js';

import { default as enumJsonSchema } from '../../../res/sidecar/enum.json';

describe('Reflection', () => {
  describe('JSONSchema fragment facets', () => {
    describe('Enum fragment', () => {
      it('Detects an enum', () => {
        expect(JSONSchemaEnumFragmentFacet.is({ enum: ['a', 'b'] })).toBe(true);
        expect(JSONSchemaEnumFragmentFacet.is(enumJsonSchema.$defs.Enum)).toBe(true);
        expect(JSONSchemaEnumFragmentFacet.is({ enum: [] })).toBe(true);
      });

      it('Rejects a non-enum', () => {
        expect(JSONSchemaEnumFragmentFacet.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaEnumFragmentFacet.is({ const: 'a' })).toBe(false);
        expect(JSONSchemaEnumFragmentFacet.is({ enum: 'a' } as any)).toBe(false);
      });

      it('Parses the enumerated values of an enum', () => {
        const enumeration = new JSONSchemaCollectionFragmentFacet(enumJsonSchema).$defs.Enum[0];
        expect(enumeration).toBeInstanceOf(JSONSchemaEnumFragmentFacet);
        expect(enumeration.enum).toEqual(['Aaa', 'Bbb', 'Ccc']);
        expect(true satisfies AssertTypeEquality<(typeof enumeration.enum)[number], 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });

      it('Infers the type of an enum', () => {
        const _enumeration = new JSONSchemaCollectionFragmentFacet(enumJsonSchema).$defs.Enum[0];
        expect(true satisfies AssertTypeEquality<typeof _enumeration.Type, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });
    });
  });
});
