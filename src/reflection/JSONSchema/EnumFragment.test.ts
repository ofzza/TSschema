import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaEnumFragmentFacet } from './index.js';

import { default as enumJsonSchema } from '../../../res/sidecar/enum.json';

describe('Reflection', () => {
  // Runtime tests of EnumFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in src/schema/JSONSchema/EnumFragment.test-d.ts,
  // so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Enum fragment', () => {
      // JSONSchemaEnumFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsEnum), the `enum` values and their `names`, and the type-only `Type`.
      // Facets are taken from a JSONSchemaCollectionFragmentFacet parsing the res/enum.json fixture, whose NamedEnum names its values by `x-enumNames`, or
      // constructed directly on inline enums of non string values. Each runtime `expect` on a parsed value is paired with an AssertTypeEquality on its static
      // type.
      it('Detects an enum', () => {
        expect(JSONSchemaEnumFragmentFacet.is({ enum: ['a', 'b'] })).toBe(true);
        expect(JSONSchemaEnumFragmentFacet.is(enumJsonSchema.$defs.Enum)).toBe(true);
        expect(JSONSchemaEnumFragmentFacet.is({ enum: [] })).toBe(true);
      });

      it('Rejects a non-enum', () => {
        // The `as any` lets through an `enum` which is not an array, which the fragment type rejects but untyped code could pass.
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

      it('Names the enumerated values by `x-enumNames`, or else by their own names', () => {
        // `x-enumNames` is used only if it lists a string per value: the misnamed enum lists too few, so its values are named by themselves.
        // See AGENTS.md › Enum names come from `x-enumNames`, `oneOf` titles, or the value itself.
        const named = new JSONSchemaCollectionFragmentFacet(enumJsonSchema).$defs.NamedEnum.find((facet) => facet instanceof JSONSchemaEnumFragmentFacet)!;
        expect(named.names).toEqual(['One', 'Two', 'Three']);
        expect(true satisfies AssertTypeEquality<typeof named.names, ['One', 'Two', 'Three']>).toBe(true);

        const unnamed = new JSONSchemaCollectionFragmentFacet(enumJsonSchema).$defs.Enum[0];
        expect(unnamed.names).toEqual(['Aaa', 'Bbb', 'Ccc']);
        expect(true satisfies AssertTypeEquality<typeof unnamed.names, ['Aaa', 'Bbb', 'Ccc']>).toBe(true);

        const values = new JSONSchemaEnumFragmentFacet({ enum: [1, true, null, { a: 1 }] } as const);
        expect(values.names).toEqual(['1', 'true', 'null', '{"a":1}']);
        expect(true satisfies AssertTypeEquality<typeof values.names, ['1', 'true', 'null', string]>).toBe(true);

        const misnamed = new JSONSchemaEnumFragmentFacet({ enum: ['a', 'b'], 'x-enumNames': ['A'] } as const);
        expect(misnamed.names).toEqual(['a', 'b']);
        expect(true satisfies AssertTypeEquality<typeof misnamed.names, ['a', 'b']>).toBe(true);
      });

      it('Infers the type of an enum', () => {
        const _enumeration = new JSONSchemaCollectionFragmentFacet(enumJsonSchema).$defs.Enum[0];
        expect(true satisfies AssertTypeEquality<typeof _enumeration.Type, 'Aaa' | 'Bbb' | 'Ccc'>).toBe(true);
      });
    });
  });
});
