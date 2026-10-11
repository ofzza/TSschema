import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaAnyOfTypeFragmentReflect,
  JSONSchemaArrayTypeFragmentReflect,
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaConstFragmentReflect,
  JSONSchemaEnumFragmentReflect,
  JSONSchemaModelFragmentReflect,
  JSONSchemaNullTypeFragmentReflect,
  JSONSchemaPrimitiveTypeFragmentReflect,
  JSONSchemaReferenceFragmentReflect,
  createJSONSchemaFragmentReflections,
  createJSONSchemaNestedFragmentReflections,
  type JSONSchemaFragmentReflection,
  type JSONSchemaNestedFragmentReflections,
  type JSONSchemaNestedFragmentsReflections,
  type JSONSchemaReflectedFragment,
} from './index.js';

import { default as jsonSchema } from '../../../res/sidecar/schema.json';

/**
 * Collection whose fragments carry `type` arrays naming non primitive types (nullable and mixed type models), and (in)directly recursive references
 */
const _schema = {
  $defs: {
    Node: {
      type: ['object', 'null'],
      properties: { value: { type: 'string' }, next: { $ref: '#/$defs/Node' } },
      required: ['value'],
    },
    Mixed: { type: ['object', 'string', 'null'], enum: ['a', null], properties: { a: { type: 'number' } } },
    Single: { type: ['object'], properties: { a: { type: 'number' } } },
    Ping: { type: 'array', items: { $ref: '#/$defs/Pong' } },
    Pong: { type: 'object', properties: { ping: { $ref: '#/$defs/Ping' } } },
    Enumerated: { type: 'string', enum: ['a', 'b'] },
    Empty: {},
  },
} as const;
type _Schema = typeof _schema;

/**
 * Names of the classes of the reflections of a fragment of the collection above
 */
function _reflectionClasses(name: keyof _Schema['$defs']) {
  return new JSONSchemaCollectionFragmentReflect(_schema).fragment(name).map((reflection) => reflection.constructor);
}

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('Fragment reflections', () => {
      it('Reflects a fragment by every reflection type matching it', () => {
        expect(_reflectionClasses('Enumerated')).toEqual([JSONSchemaEnumFragmentReflect, JSONSchemaPrimitiveTypeFragmentReflect]);
        const _enumerated = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Enumerated');
        expect(
          true satisfies AssertTypeEquality<
            (typeof _enumerated)[number],
            | JSONSchemaEnumFragmentReflect<_Schema, 'Enumerated', _Schema['$defs']['Enumerated']>
            | JSONSchemaPrimitiveTypeFragmentReflect<_Schema, 'Enumerated', _Schema['$defs']['Enumerated']>
          >,
        ).toBe(true);
      });

      it('Reflects a fragment matching no reflection type with no reflections', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        expect(collection.fragment('Empty')).toEqual([]);
        expect(true satisfies AssertTypeEquality<ReturnType<typeof collection.fragment<'Empty'>>, never[]>).toBe(true);
        expect(createJSONSchemaFragmentReflections(collection, undefined, { title: 'Annotated' })).toEqual([]);
      });

      it('Reflects a type array naming a single group of type names as if type named it directly', () => {
        expect(_reflectionClasses('Single')).toEqual([JSONSchemaModelFragmentReflect]);
        const single = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Single')[0];
        expect(single.type).toBe('object');
        expect(single.names).toEqual(['a']);
      });

      it('Reflects a type array naming several groups of type names as an implicit anyOf of a branch per group', () => {
        const node = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Node');
        expect(node.length).toBe(1);
        const anyOf = node[0];
        expect(anyOf).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentReflect);
        expect(anyOf.implicit).toBe(true);
        expect(anyOf.name).toBe('Node');
        expect(anyOf.anyOf.map((branch) => branch.map((reflection) => reflection.constructor))).toEqual([
          [JSONSchemaModelFragmentReflect],
          [JSONSchemaNullTypeFragmentReflect],
        ]);
        const branch = anyOf.anyOf[0][0];
        expect(branch instanceof JSONSchemaModelFragmentReflect && branch.names).toEqual(['value', 'next']);
        type Node = typeof anyOf.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<null extends Node ? true : false, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['value'], string>).toBe(true);
      });

      it('Reflects the type independent keywords of a type array naming several groups on the fragment itself, and leaves them out of each branch', () => {
        const mixed = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Mixed');
        expect(mixed.map((reflection) => reflection.constructor)).toEqual([JSONSchemaEnumFragmentReflect, JSONSchemaAnyOfTypeFragmentReflect]);
        const anyOf = mixed[1];
        expect(anyOf instanceof JSONSchemaAnyOfTypeFragmentReflect && anyOf.fragment).toEqual({
          anyOf: [
            { type: 'object', properties: { a: { type: 'number' } } },
            { type: 'null', properties: { a: { type: 'number' } } },
            { type: ['string'], properties: { a: { type: 'number' } } },
          ],
        });
      });

      it('Resolves (in)directly recursive references lazily', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const node = collection.fragment('Node')[0].anyOf[0][0];
        const next = node instanceof JSONSchemaModelFragmentReflect ? node.properties.next[0] : undefined;
        expect(next).toBeInstanceOf(JSONSchemaReferenceFragmentReflect);
        expect(next?.ref).toBe(collection.fragment('Node'));
        const ping = collection.fragment('Ping')[0];
        const pong = ping.items[0].ref[0];
        expect(pong).toBe(collection.fragment('Pong')[0]);
        expect(pong.properties.ping[0].ref[0]).toBe(ping);
        expect(true satisfies AssertTypeEquality<typeof pong, JSONSchemaModelFragmentReflect<_Schema, 'Pong', _Schema['$defs']['Pong']>>).toBe(true);
      });

      it('Reflects every fragment of the fixture collection', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(jsonSchema);
        expect(collection.names.every((name) => collection.fragment(name).length > 0)).toBe(true);
      });
    });

    describe('Nested fragment reflections', () => {
      it('Reflects a nested fragment, with no name', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const reflections = createJSONSchemaNestedFragmentReflections(collection, { type: 'array', items: { type: 'string' } } as const);
        expect(reflections[0]).toBeInstanceOf(JSONSchemaArrayTypeFragmentReflect);
        expect(reflections[0].name).toBe(undefined);
        expect(
          true satisfies AssertTypeEquality<
            typeof reflections,
            Array<JSONSchemaArrayTypeFragmentReflect<_Schema, undefined, { readonly type: 'array'; readonly items: { readonly type: 'string' } }>>
          >,
        ).toBe(true);
      });

      it('Reflects a nested boolean schema or array with no reflections', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        expect(createJSONSchemaNestedFragmentReflections(collection, true)).toEqual([]);
        expect(createJSONSchemaNestedFragmentReflections(collection, [{ type: 'string' }])).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaNestedFragmentReflections<_Schema, true>, never[]>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaNestedFragmentReflections<_Schema, readonly [{ readonly type: 'string' }]>, never[]>).toBe(true);
      });

      it('Infers the reflections of each fragment in an array of nested fragments, element by element for a tuple', () => {
        type Reflections = JSONSchemaNestedFragmentsReflections<_Schema, readonly [{ readonly type: 'null' }, true]>;
        expect(
          true satisfies AssertTypeEquality<Reflections, [Array<JSONSchemaNullTypeFragmentReflect<_Schema, undefined, { readonly type: 'null' }>>, never[]]>,
        ).toBe(true);
      });
    });

    describe('Fragment reflection types', () => {
      it('Infers the reflection types matching a fragment', () => {
        type Fragment = { readonly type: 'null'; readonly const: null };
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentReflection<_Schema, undefined, Fragment>,
            JSONSchemaConstFragmentReflect<_Schema, undefined, Fragment> | JSONSchemaNullTypeFragmentReflect<_Schema, undefined, Fragment>
          >,
        ).toBe(true);
      });

      it('Infers a union of reflection types from a union of fragments', () => {
        type Reflection = JSONSchemaFragmentReflection<_Schema, undefined, { readonly type: 'null' } | { readonly type: 'string' }>;
        expect(
          true satisfies AssertTypeEquality<
            Reflection,
            | JSONSchemaNullTypeFragmentReflect<_Schema, undefined, { readonly type: 'null' }>
            | JSONSchemaPrimitiveTypeFragmentReflect<_Schema, undefined, { readonly type: 'string' }>
          >,
        ).toBe(true);
      });

      it('Infers no reflection types from a fragment with no keywords, or with none matching', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentReflection<_Schema, undefined, {}>, never>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentReflection<_Schema, undefined, { readonly title: 'x' }>, never>).toBe(true);
      });

      it('Infers every reflection type from the unspecified fragment', () => {
        type Reflection = JSONSchemaFragmentReflection<JSONSchemaCollection, undefined, JSONSchemaNotCollectionFragment>;
        expect(true satisfies AssertTypeEquality<Extract<Reflection, JSONSchemaModelFragmentReflect<any, any, any>> extends never ? false : true, true>).toBe(
          true,
        );
        expect(
          true satisfies AssertTypeEquality<Extract<Reflection, JSONSchemaReferenceFragmentReflect<any, any, any>> extends never ? false : true, true>,
        ).toBe(true);
      });

      it('Gets the fragment type a nested value is reflected as', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaReflectedFragment<{ readonly type: 'string' }>, { readonly type: 'string' }>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaReflectedFragment<{ readonly $defs: {} }>, JSONSchemaNotCollectionFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaReflectedFragment<boolean>, never>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaReflectedFragment<readonly [{ readonly type: 'string' }]>, never>).toBe(true);
      });
    });
  });
});
