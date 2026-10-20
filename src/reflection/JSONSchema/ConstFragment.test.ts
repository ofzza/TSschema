import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaConstFragmentFacet } from './index.js';

import { default as constJsonSchema } from '../../../res/sidecar/const.json';

describe('Reflection', () => {
  // Runtime tests of ConstFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/ConstFragment.test-d.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Const fragment', () => {
      // JSONSchemaConstFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsConst), and the `const` value and type-only `Type` it parses. Facets are
      // taken from a JSONSchemaCollectionFragmentFacet parsing the res/const.json fixture or a small inline collection, so each is typed with its collection
      // and definition name, as the parser creates it. Each runtime `expect` on a parsed value is paired with an AssertTypeEquality on its static type.
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
        // An object constant keeps the `readonly` of the `as const` schema it was declared in: `const` values are returned as declared.
        // See AGENTS.md › A homomorphic mapped type over a schema object copies the schema literal's modifiers.
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
