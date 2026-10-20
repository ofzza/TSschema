import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaAnyOfTypeFragmentFacet,
  JSONSchemaArrayTypeFragmentFacet,
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaConstFragmentFacet,
  JSONSchemaEnumFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaNullTypeFragmentFacet,
  JSONSchemaPrimitiveTypeFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
  createJSONSchemaFragmentFacets,
  createJSONSchemaNestedFragmentFacets,
  parseJSONSchema,
  parseJSONSchemaCollection,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentFacetOf,
  type JSONSchemaNestedFragmentFacets,
  type JSONSchemaNestedFragmentsFacets,
  type JSONSchemaParsedFragment,
  type JSONSchemaFacet,
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
 * Names of the classes of the facets of a fragment of the collection above
 */
function _nodeClasses(name: keyof _Schema['$defs']) {
  return new JSONSchemaCollectionFragmentFacet(_schema).$defs[name].map((facet) => facet.constructor);
}

describe('Reflection', () => {
  // Runtime tests of FragmentFacets.ts: the entry points parsing a schema, the router, and the type-level mirror of the router. The tree mirrors the type
  // layer's `JSONSchema > JSONSchema fragments` tree, the router being the runtime counterpart of JSONSchemaFragmentType's dispatch over keywords
  // (src/schema/JSONSchema/Fragment.test-d.ts).
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe; this one holds the parsing that creates them.
    describe('Schema facets', () => {
      // parseJSONSchema, parseJSONSchemaCollection and JSONSchemaFacet, the type of what parseJSONSchema returns. Tested on small inline `as const` schemas,
      // with and without `$defs`, by the classes of the facets created, the identity of the facets references resolve to, and AssertTypeEquality on their
      // static types.
      // See AGENTS.md › The collection facet is also what every `$ref` resolves against.
      it('Parses a collection as a collection facet, followed by the facets of its root fragment', () => {
        const schema = {
          type: 'object',
          properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
          $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } },
        } as const;
        type Schema = typeof schema;
        const facets = parseJSONSchema(schema);
        expect(facets.map((facet) => facet.constructor)).toEqual([JSONSchemaCollectionFragmentFacet, JSONSchemaModelFragmentFacet]);
        expect(
          true satisfies AssertTypeEquality<
            (typeof facets)[number],
            JSONSchemaCollectionFragmentFacet<Schema> | JSONSchemaModelFragmentFacet<Schema, undefined, JSONSchemaCollectionRootFragment<Schema>>
          >,
        ).toBe(true);
        const [collection, root] = facets;
        expect(collection.fragment).toBe(schema);
        expect('$defs' in root.fragment).toBe(false);
        expect(root.name).toBe(undefined);
      });

      it('Resolves every reference of the schema against its collection facet', () => {
        const schema = {
          type: 'object',
          properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
          $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } },
        } as const;
        const facets = parseJSONSchema(schema);
        const collection = facets.find((facet) => facet instanceof JSONSchemaCollectionFragmentFacet);
        const root = facets.find((facet) => facet instanceof JSONSchemaModelFragmentFacet);
        const people = root?.properties.people[0];
        expect(people).toBeInstanceOf(JSONSchemaArrayTypeFragmentFacet);
        expect(people?.items?.[0].ref).toBe(collection?.$defs.Person);
      });

      it('Parses a collection with nothing but $defs and annotations as a collection facet alone', () => {
        const facets = parseJSONSchema({ title: 'Titled', $defs: {} } as const);
        expect(facets.length).toBe(1);
        expect(facets[0]).toBeInstanceOf(JSONSchemaCollectionFragmentFacet);
        expect(
          true satisfies AssertTypeEquality<(typeof facets)[number], JSONSchemaCollectionFragmentFacet<{ readonly title: 'Titled'; readonly $defs: {} }>>,
        ).toBe(true);
      });

      it('Parses a schema with no $defs with no collection facet, leaving its references unresolved', () => {
        const schema = { type: 'object', properties: { role: { $ref: '#/$defs/Role' } } } as const;
        const facets = parseJSONSchema(schema);
        expect(facets.map((facet) => facet.constructor)).toEqual([JSONSchemaModelFragmentFacet]);
        expect(true satisfies AssertTypeEquality<(typeof facets)[number], JSONSchemaModelFragmentFacet<JSONSchemaCollection, undefined, typeof schema>>).toBe(
          true,
        );
        const role = facets[0].properties.role[0];
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(role.refName).toBe(undefined);
        expect(role.ref).toBe(undefined);
      });

      it('Parses a collection alone, through the collection shortcut', () => {
        const schema = {
          type: 'object',
          properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
          $defs: { Person: { type: 'object', properties: { boss: { $ref: '#/$defs/Person' } } } },
        } as const;
        const collection = parseJSONSchemaCollection(schema);
        expect(collection).toBeInstanceOf(JSONSchemaCollectionFragmentFacet);
        expect(collection.fragment).toBe(schema);
        expect(collection.$defs.Person[0].properties.boss[0].ref).toBe(collection.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof collection, JSONSchemaCollectionFragmentFacet<typeof schema>>).toBe(true);
      });

      it('Rejects a schema with no $defs, through the collection shortcut', () => {
        // The runtime check guards untyped callers (`as any`); typed ones are stopped at compile time.
        expect(() => parseJSONSchemaCollection({ type: 'string' } as any)).toThrow(TypeError);
        // @ts-expect-error A schema with no `$defs` is not a collection
        expect(() => parseJSONSchemaCollection({ type: 'string' })).toThrow(TypeError);
      });

      it('Parses a schema matching no facet type with no facets', () => {
        const facets = parseJSONSchema({ title: 'Annotated' } as const);
        expect(facets).toEqual([]);
        expect(true satisfies AssertTypeEquality<typeof facets, never[]>).toBe(true);
      });

      it('Infers the facets of a schema', () => {
        type Collection = { readonly $defs: { readonly A: { readonly type: 'string' } }; readonly type: 'null' };
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFacet<Collection>,
            JSONSchemaCollectionFragmentFacet<Collection> | JSONSchemaNullTypeFragmentFacet<Collection, undefined, { readonly type: 'null' }>
          >,
        ).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFacet<{ readonly type: 'null' }>,
            JSONSchemaNullTypeFragmentFacet<JSONSchemaCollection, undefined, { readonly type: 'null' }>
          >,
        ).toBe(true);
      });
    });

    describe('Fragment facets', () => {
      // createJSONSchemaFragmentFacets, the router. Tested on the collection above, whose definitions cover several keywords on one fragment, type arrays
      // naming one or several groups of type names, (in)directly recursive references and a fragment with no keywords, by the classes of the facets parsed
      // (`_nodeClasses`), the facets themselves and AssertTypeEquality on their static types; and on the res/schema.json fixture, every definition of which
      // must parse to some facet.
      it('Parses a fragment by every facet type matching it', () => {
        // The facets come in the order the type layer intersects the keywords in.
        expect(_nodeClasses('Enumerated')).toEqual([JSONSchemaEnumFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet]);
        const _enumerated = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Enumerated;
        expect(
          true satisfies AssertTypeEquality<
            (typeof _enumerated)[number],
            | JSONSchemaEnumFragmentFacet<_Schema, 'Enumerated', _Schema['$defs']['Enumerated']>
            | JSONSchemaPrimitiveTypeFragmentFacet<_Schema, 'Enumerated', _Schema['$defs']['Enumerated']>
          >,
        ).toBe(true);
      });

      it('Parses a fragment matching no facet type with no facets', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(collection.$defs.Empty).toEqual([]);
        expect(true satisfies AssertTypeEquality<typeof collection.$defs.Empty, never[]>).toBe(true);
        expect(createJSONSchemaFragmentFacets({ title: 'Annotated' }, { collection: collection })).toEqual([]);
      });

      it('Parses a type array naming a single group of type names as if type named it directly', () => {
        expect(_nodeClasses('Single')).toEqual([JSONSchemaModelFragmentFacet]);
        const single = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Single[0];
        expect(single.type).toBe('object');
        expect(single.names).toEqual(['a']);
      });

      it('Parses a type array naming several groups of type names as an implicit anyOf of a branch per group', () => {
        // The recursive Node type can not be spelled out, so it is checked piece by piece: that it includes `null`, and the type of a property of its model
        // branch.
        // See AGENTS.md › A `type` array naming `object`, `array` and / or `null` is split into a union of branches.
        const facets = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Node;
        expect(facets.length).toBe(1);
        const anyOf = facets[0];
        expect(anyOf).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentFacet);
        expect(anyOf.implicit).toBe(true);
        expect(anyOf.name).toBe('Node');
        expect(anyOf.anyOf.map((branch) => branch.map((facet) => facet.constructor))).toEqual([
          [JSONSchemaModelFragmentFacet],
          [JSONSchemaNullTypeFragmentFacet],
        ]);
        const branch = anyOf.anyOf[0][0];
        expect(branch instanceof JSONSchemaModelFragmentFacet && branch.names).toEqual(['value', 'next']);
        type Node = typeof anyOf.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<null extends Node ? true : false, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['value'], string>).toBe(true);
      });

      it('Parses the type independent keywords of a type array naming several groups on the fragment itself, and leaves them out of each branch', () => {
        // Only the type independent keywords (here, `enum`) are left out of the branches: `properties` stays in each of them.
        const mixed = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Mixed;
        expect(mixed.map((facet) => facet.constructor)).toEqual([JSONSchemaEnumFragmentFacet, JSONSchemaAnyOfTypeFragmentFacet]);
        const anyOf = mixed[1];
        expect(anyOf instanceof JSONSchemaAnyOfTypeFragmentFacet && anyOf.fragment).toEqual({
          anyOf: [
            { type: 'object', properties: { a: { type: 'number' } } },
            { type: 'null', properties: { a: { type: 'number' } } },
            { type: ['string'], properties: { a: { type: 'number' } } },
          ],
        });
      });

      it('Resolves (in)directly recursive references lazily', () => {
        // `ref` is resolved on access rather than on construction, which would never finish for a recursive schema; it is the very array of facets the
        // collection holds for the definition, compared by identity.
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const facet = collection.$defs.Node[0].anyOf[0][0];
        const next = facet instanceof JSONSchemaModelFragmentFacet ? facet.properties.next[0] : undefined;
        expect(next).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(next?.ref).toBe(collection.$defs.Node);
        const ping = collection.$defs.Ping[0];
        const pong = ping.items[0].ref[0];
        expect(pong).toBe(collection.$defs.Pong[0]);
        expect(pong.properties.ping[0].ref[0]).toBe(ping);
        expect(true satisfies AssertTypeEquality<typeof pong, JSONSchemaModelFragmentFacet<_Schema, 'Pong', _Schema['$defs']['Pong']>>).toBe(true);
      });

      it('Parses every fragment of the fixture collection', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(jsonSchema);
        expect(collection.names.every((name) => collection.$defs[name].length > 0)).toBe(true);
      });
    });

    describe('Nested fragment facets', () => {
      // createJSONSchemaNestedFragmentFacets, parsing a fragment owned by another (with no name), and its types JSONSchemaNestedFragmentFacets /
      // JSONSchemaNestedFragmentsFacets.
      it('Parses a nested fragment, with no name', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const facets = createJSONSchemaNestedFragmentFacets({ type: 'array', items: { type: 'string' } } as const, collection);
        expect(facets[0]).toBeInstanceOf(JSONSchemaArrayTypeFragmentFacet);
        expect(facets[0].name).toBe(undefined);
        expect(
          true satisfies AssertTypeEquality<
            typeof facets,
            Array<JSONSchemaArrayTypeFragmentFacet<_Schema, undefined, { readonly type: 'array'; readonly items: { readonly type: 'string' } }>>
          >,
        ).toBe(true);
      });

      it('Parses a nested boolean schema or array with no facets', () => {
        // See AGENTS.md › Fragment facet types follow the type layer's limits, not the runtime's leniency.
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(createJSONSchemaNestedFragmentFacets(true, collection)).toEqual([]);
        expect(createJSONSchemaNestedFragmentFacets([{ type: 'string' }], collection)).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaNestedFragmentFacets<_Schema, true>, never[]>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaNestedFragmentFacets<_Schema, readonly [{ readonly type: 'string' }]>, never[]>).toBe(true);
      });

      it('Infers the facets of each fragment in an array of nested fragments, element by element for a tuple', () => {
        type Facets = JSONSchemaNestedFragmentsFacets<_Schema, readonly [{ readonly type: 'null' }, true]>;
        expect(
          true satisfies AssertTypeEquality<Facets, [Array<JSONSchemaNullTypeFragmentFacet<_Schema, undefined, { readonly type: 'null' }>>, never[]]>,
        ).toBe(true);
      });
    });

    describe('Fragment facet types', () => {
      // JSONSchemaFragmentFacetOf, the type-level mirror of the router, and JSONSchemaParsedFragment, the fragment type a nested value is parsed as. Tested at
      // type level only.
      it('Infers the facet types matching a fragment', () => {
        type Fragment = { readonly type: 'null'; readonly const: null };
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentFacetOf<_Schema, undefined, Fragment>,
            JSONSchemaConstFragmentFacet<_Schema, undefined, Fragment> | JSONSchemaNullTypeFragmentFacet<_Schema, undefined, Fragment>
          >,
        ).toBe(true);
      });

      it('Infers a union of facet types from a union of fragments', () => {
        // Distributes once over a union of fragments, as JSONSchemaFragmentType does.
        // See AGENTS.md › A conditional type on a bare type parameter distributes over unions — per conditional.
        type Facet = JSONSchemaFragmentFacetOf<_Schema, undefined, { readonly type: 'null' } | { readonly type: 'string' }>;
        expect(
          true satisfies AssertTypeEquality<
            Facet,
            | JSONSchemaNullTypeFragmentFacet<_Schema, undefined, { readonly type: 'null' }>
            | JSONSchemaPrimitiveTypeFragmentFacet<_Schema, undefined, { readonly type: 'string' }>
          >,
        ).toBe(true);
      });

      it('Infers no facet types from a fragment with no keywords, or with none matching', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentFacetOf<_Schema, undefined, {}>, never>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentFacetOf<_Schema, undefined, { readonly title: 'x' }>, never>).toBe(true);
      });

      it('Infers every facet type from the unspecified fragment', () => {
        // The union of every facet type is too large to spell out, so it is only checked to include the first and the last facet type the router creates (model
        // and reference).
        type Facet = JSONSchemaFragmentFacetOf<JSONSchemaCollection, undefined, JSONSchemaNotCollectionFragment>;
        expect(true satisfies AssertTypeEquality<Extract<Facet, JSONSchemaModelFragmentFacet<any, any, any>> extends never ? false : true, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<Extract<Facet, JSONSchemaReferenceFragmentFacet<any, any, any>> extends never ? false : true, true>).toBe(
          true,
        );
      });

      it('Gets the fragment type a nested value is parsed as', () => {
        // A nested collection is not a JSONSchemaNotCollectionFragment, which forbids `$defs`, so it is parsed as an object of unknown shape: the unspecified
        // fragment.
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<{ readonly type: 'string' }>, { readonly type: 'string' }>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<{ readonly $defs: {} }>, JSONSchemaNotCollectionFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<boolean>, never>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<readonly [{ readonly type: 'string' }]>, never>).toBe(true);
      });
    });
  });
});
