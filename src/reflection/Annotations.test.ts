import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { getTSSchemaAnnotations, type TSSchemaAnnotations, type TSSchemaAnnotationsOf, type TSSchemaDecoratorDescriptor } from './Annotations.js';
import type { JSONSchemaNotCollectionFragment } from '../schema/JSONSchema/index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

/**
 * Reads the annotations of an inline fragment at runtime, and infers them at type level
 */
function _annotations<const TFragment>(fragment: TFragment): TSSchemaAnnotationsOf<TFragment> {
  return getTSSchemaAnnotations(fragment);
}

describe('Reflection', () => {
  // Annotations (Annotations.ts): getTSSchemaAnnotations, reading a fragment's `title`, `description`, `default`, `deprecated`, `examples` and its decorators
  // (`x-decorators`), and its type-level mirror TSSchemaAnnotationsOf. Inline fragments (read with `_annotations`) cover each annotation and malformed
  // values, and the res/sidecar/schema.json fixture the decorators the sibling dotnetschema project generates from .NET attributes. Each runtime `expect` is
  // paired with an AssertTypeEquality on the literal type inferred for it.
  describe('Annotations', () => {
    describe('getTSSchemaAnnotations', () => {
      // One case per annotation, then decorators: their shapes as generated, and entries left out.
      it('Reads every annotation of a fragment', () => {
        const annotations = _annotations({
          type: 'integer',
          title: 'Count',
          description: 'How many',
          default: 1,
          deprecated: true,
          examples: [1, 2],
        });
        expect(annotations).toEqual({ title: 'Count', description: 'How many', default: 1, deprecated: true, examples: [1, 2], decorators: [] });
        expect(
          true satisfies AssertTypeEquality<
            typeof annotations,
            {
              readonly title: 'Count';
              readonly description: 'How many';
              readonly default: 1;
              readonly deprecated: true;
              readonly examples: readonly [1, 2];
              readonly decorators: readonly [];
            }
          >,
        ).toBe(true);
      });

      it('Reads every annotation as undefined, and no decorators, for a fragment with none', () => {
        const annotations = _annotations({ type: 'string' });
        expect(annotations).toStrictEqual({
          title: undefined,
          description: undefined,
          default: undefined,
          deprecated: undefined,
          examples: undefined,
          decorators: [],
        });
        expect(true satisfies AssertTypeEquality<typeof annotations.title, undefined>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof annotations.decorators, readonly []>).toBe(true);
      });

      it('Reads no annotations of a boolean schema', () => {
        const annotations = _annotations(true);
        expect(annotations.decorators).toEqual([]);
        expect(annotations.title).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof annotations.decorators, readonly []>).toBe(true);
      });

      it('Leaves out an annotation of another value type', () => {
        // Cast, as the `JSONSchema7` type would reject these values
        const annotations = getTSSchemaAnnotations({ title: 1, deprecated: 'yes', examples: 'a' } as any);
        expect([annotations.title, annotations.deprecated, annotations.examples]).toEqual([undefined, undefined, undefined]);
      });

      it('Reads a null default value as is', () => {
        // Unlike an absent `default`, which reads as undefined
        const annotations = _annotations({ type: ['string', 'null'], default: null });
        expect(annotations.default).toBe(null);
        expect(true satisfies AssertTypeEquality<typeof annotations.default, null>).toBe(true);
      });

      it('Reads the decorators of a fragment, with their arguments and properties', () => {
        // The fixture's `longitude` is decorated with a .NET RangeAttribute, constructed with two arguments and initialized with one property
        const annotations = getTSSchemaAnnotations(jsonSchema.$defs.Address.properties.longitude);
        expect(annotations.decorators).toEqual([
          {
            name: 'System.ComponentModel.DataAnnotations.RangeAttribute',
            arguments: { minimum: -180, maximum: 180 },
            properties: { MinimumIsExclusive: true },
          },
        ]);
        expect(
          true satisfies AssertTypeEquality<
            typeof annotations.decorators,
            readonly [
              TSSchemaDecoratorDescriptor<
                'System.ComponentModel.DataAnnotations.RangeAttribute',
                { readonly minimum: -180; readonly maximum: 180 },
                { readonly MinimumIsExclusive: true }
              >,
            ]
          >,
        ).toBe(true);
      });

      it('Reads the absent arguments or properties of a decorator as empty objects', () => {
        // `email` is decorated with no arguments and no properties, `isbn` with properties only
        const email = getTSSchemaAnnotations(jsonSchema.$defs.Person.properties.email);
        expect(email.decorators).toEqual([{ name: 'System.ComponentModel.DataAnnotations.EmailAddressAttribute', arguments: {}, properties: {} }]);
        expect(true satisfies AssertTypeEquality<(typeof email.decorators)[0]['arguments'], {}>).toBe(true);
        const isbn = getTSSchemaAnnotations(jsonSchema.$defs.Book.properties.isbn);
        expect(isbn.decorators[0].arguments).toEqual({});
        expect(isbn.decorators[0].properties).toEqual({ Description: 'ISBN-13, formatted with separators.', Name: 'ISBN-13' });
        expect(true satisfies AssertTypeEquality<(typeof isbn.decorators)[0]['properties']['Name'], 'ISBN-13'>).toBe(true);
      });

      it('Reads decorator values of any type as declared', () => {
        // `pageCount`'s RangeAttribute was constructed with a type and two strings, which dotnetschema writes as strings: a decorator's values are never
        // converted, nor checked against the fragment's type
        const pageCount = getTSSchemaAnnotations(jsonSchema.$defs.Book.properties.pageCount);
        expect(pageCount.decorators[0].arguments).toEqual({ type: 'System.UInt16', minimum: '1', maximum: '5000' });
        expect(true satisfies AssertTypeEquality<(typeof pageCount.decorators)[0]['arguments']['minimum'], '1'>).toBe(true);

        const mixed = _annotations({ 'x-decorators': [{ name: 'Mixed', arguments: { values: [1, 'two', null, [3, 4]], flag: false } }] });
        expect(mixed.decorators[0].arguments).toEqual({ values: [1, 'two', null, [3, 4]], flag: false });
        expect(true satisfies AssertTypeEquality<(typeof mixed.decorators)[0]['arguments']['values'], readonly [1, 'two', null, readonly [3, 4]]>).toBe(true);
      });

      it('Leaves out entries which are not decorators, and reads arguments or properties which are not objects as empty', () => {
        // An entry with no string `name` is no decorator; the type-level mirror leaves the same entries out of the tuple
        const annotations = _annotations({ 'x-decorators': [1, { arguments: {} }, { name: 'Kept', arguments: [1], properties: 'none' }] });
        expect(annotations.decorators).toEqual([{ name: 'Kept', arguments: {}, properties: {} }]);
        expect(true satisfies AssertTypeEquality<typeof annotations.decorators, readonly [TSSchemaDecoratorDescriptor<'Kept', {}, {}>]>).toBe(true);
        expect(getTSSchemaAnnotations({ 'x-decorators': 'none' } as any).decorators).toEqual([]);
      });

      it('Returns the same annotations for the same fragment', () => {
        const fragment = { title: 'A' };
        expect(getTSSchemaAnnotations(fragment)).toBe(getTSSchemaAnnotations(fragment));
      });
    });

    describe('TSSchemaAnnotationsOf', () => {
      // Type-level only cases, with no runtime counterpart.
      it('Infers any annotations for the unspecified fragment', () => {
        // It may hold keywords its type does not declare (`deprecated`, `x-decorators`), so they can not be inferred as absent
        expect(true satisfies AssertTypeEquality<TSSchemaAnnotationsOf<JSONSchemaNotCollectionFragment>, TSSchemaAnnotations>).toBe(true);
      });

      it('Infers the decorators of an array of decorators of unknown length', () => {
        type _Decorators = TSSchemaAnnotationsOf<{ 'x-decorators': Array<{ name: 'A' } | { name: 'B'; arguments: { a: 1 } }> }>['decorators'];
        expect(
          true satisfies AssertTypeEquality<
            _Decorators,
            ReadonlyArray<TSSchemaDecoratorDescriptor<'A', {}, {}> | TSSchemaDecoratorDescriptor<'B', { a: 1 }, {}>>
          >,
        ).toBe(true);
      });
    });
  });
});
