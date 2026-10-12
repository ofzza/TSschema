/**
 * Showcase of the internal runtime JSON schema fragment nodes: parsing a schema, the node class of each fragment kind, the router
 * matching a fragment to every node class it fits, and how all of it is typed. Never public: meant for understanding the inner workings of the
 * library before changing them (see CONTRIBUTE.md).
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Every claim is asserted, by `expect` at runtime and by `AssertTypeEquality` at compile time, so this file fails `npm test` the moment the
 *   nodes stop behaving as shown.
 * - Runtime results are assigned to named constants, each followed by a `// Breakpoint:` comment: put a breakpoint there and run this file with the
 *   "TS: Debug Current Test File" launch configuration to inspect the nodes.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaAnyOfTypeFragmentNode,
  JSONSchemaArrayTypeFragmentNode,
  JSONSchemaCollectionFragmentNode,
  JSONSchemaEnumFragmentNode,
  JSONSchemaFragmentNode,
  JSONSchemaModelFragmentNode,
  JSONSchemaNullTypeFragmentNode,
  JSONSchemaPrimitiveTypeFragmentNode,
  JSONSchemaReferenceFragmentNode,
  createJSONSchemaFragmentNodes,
  getJSONSchemaFragmentTypeBranches,
  parseJSONSchema,
  parseJSONSchemaCollection,
  type JSONSchemaCollectionRootFragment,
} from './index.js';

/**
 * The schema the examples below work with
 */
const schema = {
  title: 'School',
  type: 'object',
  properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
  $defs: {
    Person: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        role: { $ref: '#/$defs/Role' },
        nickname: { type: ['string', 'null'] },
        mentor: { anyOf: [{ $ref: '#/$defs/Person' }, { type: 'null' }] },
      },
      required: ['name', 'role'],
    },
    Role: { type: 'string', enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;

describe('Showcase', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Parsing a schema', () => {
      it('Parses a schema as an array of nodes, one per fragment kind its root matches', () => {
        // `parseJSONSchema` is the entry point: a schema with `$defs` is parsed as a collection node, followed by the nodes of the
        // root's other keywords (here, a model)
        const nodes = parseJSONSchema(schema);
        // Breakpoint: inspect `nodes`, a collection node and a model node of the same schema
        expect(nodes.map((node) => node.constructor)).toEqual([JSONSchemaCollectionFragmentNode, JSONSchemaModelFragmentNode]);
        type Node = (typeof nodes)[number];
        //   ^?
        // Node: JSONSchemaCollectionFragmentNode<Schema> | JSONSchemaModelFragmentNode<Schema, undefined, …> - narrow with `instanceof`
        expect(
          true satisfies AssertTypeEquality<
            Node,
            JSONSchemaCollectionFragmentNode<Schema> | JSONSchemaModelFragmentNode<Schema, undefined, JSONSchemaCollectionRootFragment<Schema>>
          >,
        ).toBe(true);

        const root = nodes.find((node) => node instanceof JSONSchemaModelFragmentNode);
        // Breakpoint: inspect `root`, a model node of the schema without its `$defs`
        expect(root?.names).toEqual(['people']);
        expect(root?.name).toBe(undefined);
      });

      it('Parses every fragment of a collection on construction', () => {
        // `parseJSONSchemaCollection` is the shortcut for a schema used as a collection of definitions: it parses the collection alone, leaving out
        // the root's other keywords. The collection node parses every `$defs` fragment up front, and is the context every `$ref` in the schema
        // is resolved against
        const collection = parseJSONSchemaCollection(schema);
        // Breakpoint: inspect `collection`, holding the nodes of every fragment in `$defs`
        expect(collection.names).toEqual(['Person', 'Role']);
        type Names = typeof collection.names;
        //   ^?
        // Names: Array<'Person' | 'Role'>
        expect(true satisfies AssertTypeEquality<Names, Array<'Person' | 'Role'>>).toBe(true);
        expect(collection.$defs.Person[0]).toBeInstanceOf(JSONSchemaModelFragmentNode);
      });

      it('Parses a schema with no $defs too, with no collection to resolve its references against', () => {
        const nodes = parseJSONSchema({ type: 'object', properties: { role: { $ref: '#/$defs/Role' } } } as const);
        const role = nodes[0].properties.role[0];
        // Breakpoint: inspect `role`, a reference node which can not be resolved
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentNode);
        expect(role.ref).toBe(undefined);
      });
    });

    describe('Nodes are typed by the fragment they parse', () => {
      it('Parses a model, with each property parsed in turn', () => {
        const person = parseJSONSchemaCollection(schema).$defs.Person[0];
        // Breakpoint: inspect `person` and its `properties`, `names` and `required`
        type Person = typeof person;
        //   ^?
        // Person: JSONSchemaModelFragmentNode<Schema, 'Person', Schema['$defs']['Person']> - no narrowing needed
        expect(true satisfies AssertTypeEquality<Person, JSONSchemaModelFragmentNode<Schema, 'Person', Schema['$defs']['Person']>>).toBe(true);
        expect(person.names).toEqual(['name', 'role', 'nickname', 'mentor']);
        expect(person.required).toEqual(['name', 'role']);

        const name = person.properties.name[0];
        // Breakpoint: inspect `name`, a primitive type node with no name of its own (it is nested)
        expect(name).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentNode);
        expect(name.type).toBe('string');
      });

      it('Parses a fragment carrying several keywords by a node per keyword', () => {
        const role = parseJSONSchemaCollection(schema).$defs.Role;
        // Breakpoint: inspect `role`, an array holding an enum node and a primitive type node of the same fragment
        expect(role.map((node) => node.constructor)).toEqual([JSONSchemaEnumFragmentNode, JSONSchemaPrimitiveTypeFragmentNode]);
        type Role = (typeof role)[number];
        //   ^?
        // Role: JSONSchemaEnumFragmentNode<…> | JSONSchemaPrimitiveTypeFragmentNode<…> - narrow with `instanceof`
        const enumeration = role.find((node) => node instanceof JSONSchemaEnumFragmentNode);
        expect(enumeration?.enum).toEqual(['student', 'teacher']);
        expect(true satisfies AssertTypeEquality<Role extends JSONSchemaFragmentNode<Schema, 'Role', any> ? true : false, true>).toBe(true);
      });

      it('Infers the value type of any node, through its type-only Type accessor', () => {
        const person = parseJSONSchemaCollection(schema).$defs.Person[0];
        type PersonType = typeof person.Type;
        //   ^?
        // PersonType: { name: string; role: 'student' | 'teacher'; nickname?: string | null; mentor?: PersonType | null } - properties not listed in
        // `required` are optional
        expect(true satisfies AssertTypeEquality<PersonType['role'], 'student' | 'teacher'>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<PersonType, 'mentor'>, { mentor?: PersonType | null }>).toBe(true);
        // `Type` holds no value: it throws if accessed at runtime
        expect(() => person.Type).toThrow();
      });
    });

    describe('References', () => {
      it('Resolves references lazily, against the nodes the collection holds', () => {
        const collection = parseJSONSchemaCollection(schema);
        const role = collection.$defs.Person[0].properties.role[0];
        // Breakpoint: inspect `role`, a reference node: `refName` is parsed on construction, `ref` is only resolved when accessed
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentNode);
        expect(role.refName).toBe('Role');
        expect(role.ref).toBe(collection.$defs.Role);
      });

      it('Resolves a recursive reference, as it is never resolved eagerly', () => {
        const collection = parseJSONSchemaCollection(schema);
        const person = collection.$defs.Person[0];
        const mentor = person.properties.mentor[0].anyOf[0][0].ref[0];
        // Breakpoint: inspect `mentor`, the very same node as `person`
        expect(mentor).toBe(person);
      });
    });

    describe('Type arrays', () => {
      it('Splits a type array naming object, array and / or null into branches', () => {
        const branches = getJSONSchemaFragmentTypeBranches(schema.$defs.Person.properties.nickname);
        // Breakpoint: inspect `branches`, the runtime counterpart of `JSONSchemaFragmentTypeBranch`
        expect(branches).toEqual([{ type: 'null' }, { type: ['string'] }]);
      });

      it('Parses several branches as an implicit anyOf', () => {
        const nickname = parseJSONSchemaCollection(schema).$defs.Person[0].properties.nickname[0];
        // Breakpoint: inspect `nickname`, an any-of-types node with `implicit: true`, holding a node of each branch
        expect(nickname).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentNode);
        expect(nickname.implicit).toBe(true);
        expect(nickname.anyOf.map(([branch]) => branch.constructor)).toEqual([JSONSchemaNullTypeFragmentNode, JSONSchemaPrimitiveTypeFragmentNode]);
        type Nickname = typeof nickname.Type;
        //   ^?
        // Nickname: string | null
        expect(true satisfies AssertTypeEquality<Nickname, string | null>).toBe(true);
      });
    });

    describe('The router', () => {
      it('Parses any fragment, by every node class it matches', () => {
        // Every node class has a static `is` type guard, the runtime counterpart of `JSONSchemaFragmentIs*`, which the router tries in turn. The
        // router is internal to parsing a schema: like every node class, it takes the fragment, then optionally the collection node to
        // resolve references against (`context`) and the fragment's name within it (`name`)
        const collection = parseJSONSchemaCollection(schema);
        const nodes = createJSONSchemaFragmentNodes({ type: 'array', items: { type: 'integer' } } as const, { context: collection });
        // Breakpoint: inspect `nodes`, a single array type node, its `items` parsed in turn
        expect(nodes[0]).toBeInstanceOf(JSONSchemaArrayTypeFragmentNode);
        expect(JSONSchemaArrayTypeFragmentNode.is({ type: 'array' })).toBe(true);
        type Items = (typeof nodes)[0]['items'];
        //   ^?
        // Items: Array<JSONSchemaPrimitiveTypeFragmentNode<Schema, undefined, { readonly type: 'integer' }>>
        expect(true satisfies AssertTypeEquality<Items, Array<JSONSchemaPrimitiveTypeFragmentNode<Schema, undefined, { readonly type: 'integer' }>>>).toBe(
          true,
        );
      });

      it('Parses a fragment matching no node class with no nodes', () => {
        const nodes = createJSONSchemaFragmentNodes({ title: 'Annotation' } as const);
        // Breakpoint: inspect `nodes`, empty: annotations alone constrain nothing
        expect(nodes).toEqual([]);
      });
    });
  });
});
