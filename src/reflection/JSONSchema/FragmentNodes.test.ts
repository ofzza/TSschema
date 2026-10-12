import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaAnyOfTypeFragmentNode,
  JSONSchemaArrayTypeFragmentNode,
  JSONSchemaCollectionFragmentNode,
  JSONSchemaConstFragmentNode,
  JSONSchemaEnumFragmentNode,
  JSONSchemaModelFragmentNode,
  JSONSchemaNullTypeFragmentNode,
  JSONSchemaPrimitiveTypeFragmentNode,
  JSONSchemaReferenceFragmentNode,
  createJSONSchemaFragmentNodes,
  createJSONSchemaNestedFragmentNodes,
  parseJSONSchema,
  parseJSONSchemaCollection,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentNodeOf,
  type JSONSchemaNestedFragmentNodes,
  type JSONSchemaNestedFragmentsNodes,
  type JSONSchemaParsedFragment,
  type JSONSchemaNode,
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
 * Names of the classes of the nodes of a fragment of the collection above
 */
function _nodeClasses(name: keyof _Schema['$defs']) {
  return new JSONSchemaCollectionFragmentNode(_schema).$defs[name].map((node) => node.constructor);
}

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Schema nodes', () => {
      it('Parses a collection as a collection node, followed by the nodes of its root fragment', () => {
        const schema = {
          type: 'object',
          properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
          $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } },
        } as const;
        type Schema = typeof schema;
        const nodes = parseJSONSchema(schema);
        expect(nodes.map((node) => node.constructor)).toEqual([JSONSchemaCollectionFragmentNode, JSONSchemaModelFragmentNode]);
        expect(
          true satisfies AssertTypeEquality<
            (typeof nodes)[number],
            JSONSchemaCollectionFragmentNode<Schema> | JSONSchemaModelFragmentNode<Schema, undefined, JSONSchemaCollectionRootFragment<Schema>>
          >,
        ).toBe(true);
        const [collection, root] = nodes;
        expect(collection.fragment).toBe(schema);
        expect('$defs' in root.fragment).toBe(false);
        expect(root.name).toBe(undefined);
      });

      it('Resolves every reference of the schema against its collection node', () => {
        const schema = {
          type: 'object',
          properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
          $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } },
        } as const;
        const nodes = parseJSONSchema(schema);
        const collection = nodes.find((node) => node instanceof JSONSchemaCollectionFragmentNode);
        const root = nodes.find((node) => node instanceof JSONSchemaModelFragmentNode);
        const people = root?.properties.people[0];
        expect(people).toBeInstanceOf(JSONSchemaArrayTypeFragmentNode);
        expect(people?.items?.[0].ref).toBe(collection?.$defs.Person);
      });

      it('Parses a collection with nothing but $defs and annotations as a collection node alone', () => {
        const nodes = parseJSONSchema({ title: 'Titled', $defs: {} } as const);
        expect(nodes.length).toBe(1);
        expect(nodes[0]).toBeInstanceOf(JSONSchemaCollectionFragmentNode);
        expect(
          true satisfies AssertTypeEquality<(typeof nodes)[number], JSONSchemaCollectionFragmentNode<{ readonly title: 'Titled'; readonly $defs: {} }>>,
        ).toBe(true);
      });

      it('Parses a schema with no $defs with no collection node, leaving its references unresolved', () => {
        const schema = { type: 'object', properties: { role: { $ref: '#/$defs/Role' } } } as const;
        const nodes = parseJSONSchema(schema);
        expect(nodes.map((node) => node.constructor)).toEqual([JSONSchemaModelFragmentNode]);
        expect(true satisfies AssertTypeEquality<(typeof nodes)[number], JSONSchemaModelFragmentNode<JSONSchemaCollection, undefined, typeof schema>>).toBe(
          true,
        );
        const role = nodes[0].properties.role[0];
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentNode);
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
        expect(collection).toBeInstanceOf(JSONSchemaCollectionFragmentNode);
        expect(collection.fragment).toBe(schema);
        expect(collection.$defs.Person[0].properties.boss[0].ref).toBe(collection.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof collection, JSONSchemaCollectionFragmentNode<typeof schema>>).toBe(true);
      });

      it('Rejects a schema with no $defs, through the collection shortcut', () => {
        expect(() => parseJSONSchemaCollection({ type: 'string' } as any)).toThrow(TypeError);
        // @ts-expect-error A schema with no `$defs` is not a collection
        expect(() => parseJSONSchemaCollection({ type: 'string' })).toThrow(TypeError);
      });

      it('Parses a schema matching no node type with no nodes', () => {
        const nodes = parseJSONSchema({ title: 'Annotated' } as const);
        expect(nodes).toEqual([]);
        expect(true satisfies AssertTypeEquality<typeof nodes, never[]>).toBe(true);
      });

      it('Infers the nodes of a schema', () => {
        type Collection = { readonly $defs: { readonly A: { readonly type: 'string' } }; readonly type: 'null' };
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaNode<Collection>,
            JSONSchemaCollectionFragmentNode<Collection> | JSONSchemaNullTypeFragmentNode<Collection, undefined, { readonly type: 'null' }>
          >,
        ).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaNode<{ readonly type: 'null' }>,
            JSONSchemaNullTypeFragmentNode<JSONSchemaCollection, undefined, { readonly type: 'null' }>
          >,
        ).toBe(true);
      });
    });

    describe('Fragment nodes', () => {
      it('Parses a fragment by every node type matching it', () => {
        expect(_nodeClasses('Enumerated')).toEqual([JSONSchemaEnumFragmentNode, JSONSchemaPrimitiveTypeFragmentNode]);
        const _enumerated = new JSONSchemaCollectionFragmentNode(_schema).$defs.Enumerated;
        expect(
          true satisfies AssertTypeEquality<
            (typeof _enumerated)[number],
            | JSONSchemaEnumFragmentNode<_Schema, 'Enumerated', _Schema['$defs']['Enumerated']>
            | JSONSchemaPrimitiveTypeFragmentNode<_Schema, 'Enumerated', _Schema['$defs']['Enumerated']>
          >,
        ).toBe(true);
      });

      it('Parses a fragment matching no node type with no nodes', () => {
        const collection = new JSONSchemaCollectionFragmentNode(_schema);
        expect(collection.$defs.Empty).toEqual([]);
        expect(true satisfies AssertTypeEquality<typeof collection.$defs.Empty, never[]>).toBe(true);
        expect(createJSONSchemaFragmentNodes({ title: 'Annotated' }, { context: collection })).toEqual([]);
      });

      it('Parses a type array naming a single group of type names as if type named it directly', () => {
        expect(_nodeClasses('Single')).toEqual([JSONSchemaModelFragmentNode]);
        const single = new JSONSchemaCollectionFragmentNode(_schema).$defs.Single[0];
        expect(single.type).toBe('object');
        expect(single.names).toEqual(['a']);
      });

      it('Parses a type array naming several groups of type names as an implicit anyOf of a branch per group', () => {
        const node = new JSONSchemaCollectionFragmentNode(_schema).$defs.Node;
        expect(node.length).toBe(1);
        const anyOf = node[0];
        expect(anyOf).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentNode);
        expect(anyOf.implicit).toBe(true);
        expect(anyOf.name).toBe('Node');
        expect(anyOf.anyOf.map((branch) => branch.map((node) => node.constructor))).toEqual([[JSONSchemaModelFragmentNode], [JSONSchemaNullTypeFragmentNode]]);
        const branch = anyOf.anyOf[0][0];
        expect(branch instanceof JSONSchemaModelFragmentNode && branch.names).toEqual(['value', 'next']);
        type Node = typeof anyOf.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<null extends Node ? true : false, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<Exclude<Node, null>['value'], string>).toBe(true);
      });

      it('Parses the type independent keywords of a type array naming several groups on the fragment itself, and leaves them out of each branch', () => {
        const mixed = new JSONSchemaCollectionFragmentNode(_schema).$defs.Mixed;
        expect(mixed.map((node) => node.constructor)).toEqual([JSONSchemaEnumFragmentNode, JSONSchemaAnyOfTypeFragmentNode]);
        const anyOf = mixed[1];
        expect(anyOf instanceof JSONSchemaAnyOfTypeFragmentNode && anyOf.fragment).toEqual({
          anyOf: [
            { type: 'object', properties: { a: { type: 'number' } } },
            { type: 'null', properties: { a: { type: 'number' } } },
            { type: ['string'], properties: { a: { type: 'number' } } },
          ],
        });
      });

      it('Resolves (in)directly recursive references lazily', () => {
        const collection = new JSONSchemaCollectionFragmentNode(_schema);
        const node = collection.$defs.Node[0].anyOf[0][0];
        const next = node instanceof JSONSchemaModelFragmentNode ? node.properties.next[0] : undefined;
        expect(next).toBeInstanceOf(JSONSchemaReferenceFragmentNode);
        expect(next?.ref).toBe(collection.$defs.Node);
        const ping = collection.$defs.Ping[0];
        const pong = ping.items[0].ref[0];
        expect(pong).toBe(collection.$defs.Pong[0]);
        expect(pong.properties.ping[0].ref[0]).toBe(ping);
        expect(true satisfies AssertTypeEquality<typeof pong, JSONSchemaModelFragmentNode<_Schema, 'Pong', _Schema['$defs']['Pong']>>).toBe(true);
      });

      it('Parses every fragment of the fixture collection', () => {
        const collection = new JSONSchemaCollectionFragmentNode(jsonSchema);
        expect(collection.names.every((name) => collection.$defs[name].length > 0)).toBe(true);
      });
    });

    describe('Nested fragment nodes', () => {
      it('Parses a nested fragment, with no name', () => {
        const collection = new JSONSchemaCollectionFragmentNode(_schema);
        const nodes = createJSONSchemaNestedFragmentNodes({ type: 'array', items: { type: 'string' } } as const, collection);
        expect(nodes[0]).toBeInstanceOf(JSONSchemaArrayTypeFragmentNode);
        expect(nodes[0].name).toBe(undefined);
        expect(
          true satisfies AssertTypeEquality<
            typeof nodes,
            Array<JSONSchemaArrayTypeFragmentNode<_Schema, undefined, { readonly type: 'array'; readonly items: { readonly type: 'string' } }>>
          >,
        ).toBe(true);
      });

      it('Parses a nested boolean schema or array with no nodes', () => {
        const collection = new JSONSchemaCollectionFragmentNode(_schema);
        expect(createJSONSchemaNestedFragmentNodes(true, collection)).toEqual([]);
        expect(createJSONSchemaNestedFragmentNodes([{ type: 'string' }], collection)).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaNestedFragmentNodes<_Schema, true>, never[]>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaNestedFragmentNodes<_Schema, readonly [{ readonly type: 'string' }]>, never[]>).toBe(true);
      });

      it('Infers the nodes of each fragment in an array of nested fragments, element by element for a tuple', () => {
        type Nodes = JSONSchemaNestedFragmentsNodes<_Schema, readonly [{ readonly type: 'null' }, true]>;
        expect(true satisfies AssertTypeEquality<Nodes, [Array<JSONSchemaNullTypeFragmentNode<_Schema, undefined, { readonly type: 'null' }>>, never[]]>).toBe(
          true,
        );
      });
    });

    describe('Fragment node types', () => {
      it('Infers the node types matching a fragment', () => {
        type Fragment = { readonly type: 'null'; readonly const: null };
        expect(
          true satisfies AssertTypeEquality<
            JSONSchemaFragmentNodeOf<_Schema, undefined, Fragment>,
            JSONSchemaConstFragmentNode<_Schema, undefined, Fragment> | JSONSchemaNullTypeFragmentNode<_Schema, undefined, Fragment>
          >,
        ).toBe(true);
      });

      it('Infers a union of node types from a union of fragments', () => {
        type Node = JSONSchemaFragmentNodeOf<_Schema, undefined, { readonly type: 'null' } | { readonly type: 'string' }>;
        expect(
          true satisfies AssertTypeEquality<
            Node,
            | JSONSchemaNullTypeFragmentNode<_Schema, undefined, { readonly type: 'null' }>
            | JSONSchemaPrimitiveTypeFragmentNode<_Schema, undefined, { readonly type: 'string' }>
          >,
        ).toBe(true);
      });

      it('Infers no node types from a fragment with no keywords, or with none matching', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentNodeOf<_Schema, undefined, {}>, never>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentNodeOf<_Schema, undefined, { readonly title: 'x' }>, never>).toBe(true);
      });

      it('Infers every node type from the unspecified fragment', () => {
        type Node = JSONSchemaFragmentNodeOf<JSONSchemaCollection, undefined, JSONSchemaNotCollectionFragment>;
        expect(true satisfies AssertTypeEquality<Extract<Node, JSONSchemaModelFragmentNode<any, any, any>> extends never ? false : true, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<Extract<Node, JSONSchemaReferenceFragmentNode<any, any, any>> extends never ? false : true, true>).toBe(true);
      });

      it('Gets the fragment type a nested value is parsed as', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<{ readonly type: 'string' }>, { readonly type: 'string' }>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<{ readonly $defs: {} }>, JSONSchemaNotCollectionFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<boolean>, never>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaParsedFragment<readonly [{ readonly type: 'string' }]>, never>).toBe(true);
      });
    });
  });
});
