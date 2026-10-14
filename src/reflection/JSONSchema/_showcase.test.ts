/**
 * Showcase of the internal runtime JSON schema fragment facets: parsing a schema, the facet class of each fragment kind, the router
 * matching a fragment to every facet class it fits, and how all of it is typed. Never public: meant for understanding the inner workings of the
 * library before changing them (see CONTRIBUTE.md).
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Every claim is asserted, by `expect` at runtime and by `AssertTypeEquality` at compile time, so this file fails `npm test` the moment the
 *   facets stop behaving as shown.
 * - Runtime results are assigned to named constants, each followed by a `// Breakpoint:` comment: put a breakpoint there and run this file with the
 *   "TS: Debug Current Test File" launch configuration to inspect the facets.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaAnyOfTypeFragmentFacet,
  JSONSchemaArrayTypeFragmentFacet,
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaEnumFragmentFacet,
  JSONSchemaFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaNullTypeFragmentFacet,
  JSONSchemaPrimitiveTypeFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
  createJSONSchemaFragmentFacets,
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
  // Internal showcase of src/reflection/JSONSchema/, the JSON schema base of the runtime layer: parsing a schema into facets, as the type layer's showcase
  // (src/schema/JSONSchema/_showcase.test.ts) walks through the fragment types the facets are typed by. Every example parses the small inline `as const` schema
  // above (a root model next to `$defs` with a recursive model and an enum), with runtime expects paired with AssertTypeEquality.
  describe('JSONSchema fragment facets', () => {
    // Each nested describe shows one aspect of the facets, in the order they build on each other.
    describe('Parsing a schema', () => {
      // The entry points: parseJSONSchema for any schema, parseJSONSchemaCollection for a collection of definitions alone.
      it('Parses a schema as an array of facets, one per fragment kind its root matches', () => {
        // `parseJSONSchema` is the entry point: a schema with `$defs` is parsed as a collection facet, followed by the facets of the
        // root's other keywords (here, a model)
        const facets = parseJSONSchema(schema);
        // Breakpoint: inspect `facets`, a collection facet and a model facet of the same schema
        expect(facets.map((facet) => facet.constructor)).toEqual([JSONSchemaCollectionFragmentFacet, JSONSchemaModelFragmentFacet]);
        type Facet = (typeof facets)[number];
        //   ^?
        // Facet: JSONSchemaCollectionFragmentFacet<Schema> | JSONSchemaModelFragmentFacet<Schema, undefined, …> - narrow with `instanceof`
        expect(
          true satisfies AssertTypeEquality<
            Facet,
            JSONSchemaCollectionFragmentFacet<Schema> | JSONSchemaModelFragmentFacet<Schema, undefined, JSONSchemaCollectionRootFragment<Schema>>
          >,
        ).toBe(true);

        const root = facets.find((facet) => facet instanceof JSONSchemaModelFragmentFacet);
        // Breakpoint: inspect `root`, a model facet of the schema without its `$defs`
        expect(root?.names).toEqual(['people']);
        expect(root?.name).toBe(undefined);
      });

      it('Parses every fragment of a collection on construction', () => {
        // `parseJSONSchemaCollection` is the shortcut for a schema used as a collection of definitions: it parses the collection alone, leaving out
        // the root's other keywords. The collection facet parses every `$defs` fragment up front, and is the collection every `$ref` in the schema
        // is resolved against
        const collection = parseJSONSchemaCollection(schema);
        // Breakpoint: inspect `collection`, holding the facets of every fragment in `$defs`
        expect(collection.names).toEqual(['Person', 'Role']);
        type Names = typeof collection.names;
        //   ^?
        // Names: Array<'Person' | 'Role'>
        expect(true satisfies AssertTypeEquality<Names, Array<'Person' | 'Role'>>).toBe(true);
        expect(collection.$defs.Person[0]).toBeInstanceOf(JSONSchemaModelFragmentFacet);
      });

      it('Parses a schema with no $defs too, with no collection to resolve its references against', () => {
        const facets = parseJSONSchema({ type: 'object', properties: { role: { $ref: '#/$defs/Role' } } } as const);
        const role = facets[0].properties.role[0];
        // Breakpoint: inspect `role`, a reference facet which can not be resolved
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(role.ref).toBe(undefined);
      });
    });

    describe('Facets are typed by the fragment they parse', () => {
      // The facet classes, typed with the fragment they parse, its collection and its definition name.
      it('Parses a model, with each property parsed in turn', () => {
        const person = parseJSONSchemaCollection(schema).$defs.Person[0];
        // Breakpoint: inspect `person` and its `properties`, `names` and `required`
        type Person = typeof person;
        //   ^?
        // Person: JSONSchemaModelFragmentFacet<Schema, 'Person', Schema['$defs']['Person']> - no narrowing needed
        expect(true satisfies AssertTypeEquality<Person, JSONSchemaModelFragmentFacet<Schema, 'Person', Schema['$defs']['Person']>>).toBe(true);
        expect(person.names).toEqual(['name', 'role', 'nickname', 'mentor']);
        expect(person.required).toEqual(['name', 'role']);

        const name = person.properties.name[0];
        // Breakpoint: inspect `name`, a primitive type facet with no name of its own (it is nested)
        expect(name).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
        expect(name.type).toBe('string');
      });

      it('Parses a fragment carrying several keywords by a facet per keyword', () => {
        const role = parseJSONSchemaCollection(schema).$defs.Role;
        // Breakpoint: inspect `role`, an array holding an enum facet and a primitive type facet of the same fragment
        expect(role.map((facet) => facet.constructor)).toEqual([JSONSchemaEnumFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet]);
        type Role = (typeof role)[number];
        //   ^?
        // Role: JSONSchemaEnumFragmentFacet<…> | JSONSchemaPrimitiveTypeFragmentFacet<…> - narrow with `instanceof`
        const enumeration = role.find((facet) => facet instanceof JSONSchemaEnumFragmentFacet);
        expect(enumeration?.enum).toEqual(['student', 'teacher']);
        // An enum also names its values: by its `x-enumNames` vendor keyword if it has one, here by the values themselves
        expect(enumeration?.names).toEqual(['student', 'teacher']);
        expect(true satisfies AssertTypeEquality<Role extends JSONSchemaFragmentFacet<Schema, 'Role', any> ? true : false, true>).toBe(true);
      });

      it('Parses the validation keywords applying to its kind of values', () => {
        // Each facet class parses the validation keywords of the values it describes, `undefined` where the fragment has none: numbers and strings for the
        // primitive type facet, arrays for the array type facet, objects for the object type and model facets. Annotations are not parsed by any facet.
        const [count] = parseJSONSchema({ type: 'integer', minimum: 1, title: 'Count' } as const);
        // Breakpoint: inspect `count`, with `minimum` and every other validation keyword of numbers and strings
        expect(count).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
        const minimum = count.minimum;
        expect(minimum).toBe(1);
        type Minimum = typeof minimum;
        //   ^?
        // Minimum: 1
        expect(true satisfies AssertTypeEquality<Minimum, 1>).toBe(true);
      });

      it('Infers the value type of any facet, through its type-only Type accessor', () => {
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
      // The reference facet, resolving against the collection facet.
      it('Resolves references lazily, against the facets the collection holds', () => {
        const collection = parseJSONSchemaCollection(schema);
        const role = collection.$defs.Person[0].properties.role[0];
        // Breakpoint: inspect `role`, a reference facet: `refName` is parsed on construction, `ref` is only resolved when accessed
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(role.refName).toBe('Role');
        expect(role.ref).toBe(collection.$defs.Role);
      });

      it('Resolves a recursive reference, as it is never resolved eagerly', () => {
        const collection = parseJSONSchemaCollection(schema);
        const person = collection.$defs.Person[0];
        const mentor = person.properties.mentor[0].anyOf[0][0].ref[0];
        // Breakpoint: inspect `mentor`, the very same facet as `person`
        expect(mentor).toBe(person);
      });
    });

    describe('Type arrays', () => {
      // Type arrays naming non primitive types, split into branches parsed as an implicit `anyOf`.
      it('Splits a type array naming object, array and / or null into branches', () => {
        const branches = getJSONSchemaFragmentTypeBranches(schema.$defs.Person.properties.nickname);
        // Breakpoint: inspect `branches`, the runtime counterpart of `JSONSchemaFragmentTypeBranch`
        expect(branches).toEqual([{ type: 'null' }, { type: ['string'] }]);
      });

      it('Parses several branches as an implicit anyOf', () => {
        const nickname = parseJSONSchemaCollection(schema).$defs.Person[0].properties.nickname[0];
        // Breakpoint: inspect `nickname`, an any-of-types facet with `implicit: true`, holding a facet of each branch
        expect(nickname).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentFacet);
        expect(nickname.implicit).toBe(true);
        expect(nickname.anyOf.map(([branch]) => branch.constructor)).toEqual([JSONSchemaNullTypeFragmentFacet, JSONSchemaPrimitiveTypeFragmentFacet]);
        type Nickname = typeof nickname.Type;
        //   ^?
        // Nickname: string | null
        expect(true satisfies AssertTypeEquality<Nickname, string | null>).toBe(true);
      });
    });

    describe('The router', () => {
      // The router, which every entry point and facet class parsing a nested fragment goes through.
      it('Parses any fragment, by every facet class it matches', () => {
        // Every facet class has a static `is` type guard, the runtime counterpart of `JSONSchemaFragmentIs*`, which the router tries in turn. The
        // router is internal to parsing a schema: like every facet class, it takes the fragment, then optionally the collection facet to
        // resolve references against (`collection`) and the fragment's name within it (`name`)
        const collection = parseJSONSchemaCollection(schema);
        const facets = createJSONSchemaFragmentFacets({ type: 'array', items: { type: 'integer' } } as const, { collection: collection });
        // Breakpoint: inspect `facets`, a single array type facet, its `items` parsed in turn
        expect(facets[0]).toBeInstanceOf(JSONSchemaArrayTypeFragmentFacet);
        expect(JSONSchemaArrayTypeFragmentFacet.is({ type: 'array' })).toBe(true);
        type Items = (typeof facets)[0]['items'];
        //   ^?
        // Items: Array<JSONSchemaPrimitiveTypeFragmentFacet<Schema, undefined, { readonly type: 'integer' }>>
        expect(true satisfies AssertTypeEquality<Items, Array<JSONSchemaPrimitiveTypeFragmentFacet<Schema, undefined, { readonly type: 'integer' }>>>).toBe(
          true,
        );
      });

      it('Parses a fragment matching no facet class with no facets', () => {
        const facets = createJSONSchemaFragmentFacets({ title: 'Annotation' } as const);
        // Breakpoint: inspect `facets`, empty: annotations alone constrain nothing
        expect(facets).toEqual([]);
      });
    });
  });
});
