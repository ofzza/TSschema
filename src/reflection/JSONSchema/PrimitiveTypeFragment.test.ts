import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaAnyOfTypeFragmentFacet, JSONSchemaCollectionFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet, parseJSONSchema } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Text: { type: 'string', format: 'email', maxLength: 64 },
    Count: { type: 'integer' },
    Scalar: { type: ['string', 'number', 'boolean'] },
    Bounded: { type: 'number', minimum: 0, exclusiveMaximum: 10, multipleOf: 0.5, format: 'decimal' },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  // Runtime tests of PrimitiveTypeFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/PrimitiveTypeFragment.test-d.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Primitive Type fragment', () => {
      // JSONSchemaPrimitiveTypeFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsPrimitiveType), the `type` it parses (a name or an array of
      // names), the validation keywords of numbers and strings (and `format`, applying to values of any type) it parses, and the type-only `Type`. Facets are taken from a JSONSchemaCollectionFragmentFacet parsing the small inline collection above. Each runtime
      // `expect` on a parsed value is paired with an AssertTypeEquality on its static type.
      it('Detects a primitive type', () => {
        expect(['string', 'number', 'integer', 'boolean'].every((type) => JSONSchemaPrimitiveTypeFragmentFacet.is({ type } as any))).toBe(true);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: ['string', 'number'] })).toBe(true);
      });

      it('Rejects a non-primitive type, including null', () => {
        // A type array naming `null` is not a primitive type: the router splits it into branches before any facet class checks it.
        // See AGENTS.md › `null` is not a primitive type.
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: 'null' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: 'object' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: 'array' })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ type: ['string', 'null'] })).toBe(false);
        expect(JSONSchemaPrimitiveTypeFragmentFacet.is({ enum: ['a'] })).toBe(false);
      });

      it('Parses the type of a primitive type', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const text = collection.$defs.Text[0];
        expect(text).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
        expect(text.type).toBe('string');
        expect(true satisfies AssertTypeEquality<typeof text.type, 'string'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof text, JSONSchemaPrimitiveTypeFragmentFacet<_Schema, 'Text', _Schema['$defs']['Text']>>).toBe(true);
      });

      it('Parses the types of an array of primitive types', () => {
        const scalar = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Scalar[0];
        expect(scalar.type).toEqual(['string', 'number', 'boolean']);
        expect(true satisfies AssertTypeEquality<typeof scalar.type, readonly ['string', 'number', 'boolean']>).toBe(true);
      });

      it('Parses the validation keywords of a number and a string', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const bounded = collection.$defs.Bounded[0];
        expect([bounded.minimum, bounded.maximum, bounded.exclusiveMinimum, bounded.exclusiveMaximum, bounded.multipleOf]).toEqual([
          0,
          undefined,
          undefined,
          10,
          0.5,
        ]);
        expect(true satisfies AssertTypeEquality<typeof bounded.minimum, 0>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof bounded.maximum, undefined>).toBe(true);
        expect(bounded.format).toBe('decimal');
        expect(true satisfies AssertTypeEquality<typeof bounded.format, 'decimal'>).toBe(true);
        const text = collection.$defs.Text[0];
        expect([text.format, text.maxLength, text.minLength, text.pattern, text.contentEncoding]).toEqual(['email', 64, undefined, undefined, undefined]);
        expect(true satisfies AssertTypeEquality<typeof text.format, 'email'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof text.maxLength, 64>).toBe(true);
      });

      it('Parses a validation keyword of another value type as undefined', () => {
        // E.g. the draft 4 boolean `exclusiveMinimum`, which JSON Schema 2020-12 replaced by a number
        const facet = new JSONSchemaPrimitiveTypeFragmentFacet({ type: 'number', exclusiveMinimum: true, minimum: '1' } as any);
        expect([facet.exclusiveMinimum, facet.minimum]).toEqual([undefined, undefined]);
      });

      it('Keeps the validation keywords in the branch of a nullable primitive type', () => {
        // A type array naming `null` is split into branches, each keeping every keyword other than `type` (see AGENTS.md › A type array naming object,
        // array and / or null is split into a union of branches)
        const [anyOf] = parseJSONSchema({ type: ['string', 'null'], maxLength: 3 } as const);
        expect(anyOf).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentFacet);
        const string = (anyOf as JSONSchemaAnyOfTypeFragmentFacet<any>).anyOf.flat().find((facet) => facet instanceof JSONSchemaPrimitiveTypeFragmentFacet);
        expect(string?.maxLength).toBe(3);
      });

      it('Infers the type of a primitive type', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const _count = collection.$defs.Count[0];
        expect(true satisfies AssertTypeEquality<typeof _count.Type, number>).toBe(true);
        const _scalar = collection.$defs.Scalar[0];
        expect(true satisfies AssertTypeEquality<typeof _scalar.Type, string | number | boolean>).toBe(true);
      });
    });
  });
});
