/**
 * Showcase of the internal runtime JSON schema fragment reflections: reflecting a collection, the reflection class of each fragment kind, the router
 * matching a fragment to every reflection class it fits, and how all of it is typed. Never public: meant for understanding the inner workings of the
 * library before changing them (see CONTRIBUTE.md).
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Every claim is asserted, by `expect` at runtime and by `AssertTypeEquality` at compile time, so this file fails `npm test` the moment the
 *   reflections stop behaving as shown.
 * - Runtime results are assigned to named constants, each followed by a `// Breakpoint:` comment: put a breakpoint there and run this file with the
 *   "TS: Debug Current Test File" launch configuration to inspect the reflections.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaAnyOfTypeFragmentReflect,
  JSONSchemaArrayTypeFragmentReflect,
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaEnumFragmentReflect,
  JSONSchemaFragmentReflect,
  JSONSchemaModelFragmentReflect,
  JSONSchemaNullTypeFragmentReflect,
  JSONSchemaPrimitiveTypeFragmentReflect,
  JSONSchemaReferenceFragmentReflect,
  createJSONSchemaFragmentReflections,
  getJSONSchemaFragmentTypeBranches,
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
  describe('JSONSchema fragment reflections', () => {
    describe('Reflecting a collection', () => {
      it('Reflects every fragment of a collection on construction', () => {
        // The collection reflection is the entry point: it reflects every `$defs` fragment up front, and resolves every `$ref` against them later
        const collection = new JSONSchemaCollectionFragmentReflect(schema);
        // Breakpoint: inspect `collection`, holding the reflections of every fragment in `_fragmentReflections`
        expect(collection.names).toEqual(['Person', 'Role']);
        type Names = typeof collection.names;
        //   ^?
        // Names: Array<'Person' | 'Role'>
        expect(true satisfies AssertTypeEquality<Names, Array<'Person' | 'Role'>>).toBe(true);
      });

      it('Reflects the root fragment of a collection, i.e. everything but $defs', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(schema);
        const root = collection.root[0];
        // Breakpoint: inspect `root`, a model reflection of the schema without its `$defs`
        expect(root.names).toEqual(['people']);
        expect(root.name).toBe(undefined);
      });
    });

    describe('Reflections are typed by the fragment they reflect', () => {
      it('Reflects a model, with each property reflected in turn', () => {
        const person = new JSONSchemaCollectionFragmentReflect(schema).fragment('Person')[0];
        // Breakpoint: inspect `person` and its `properties`, `names` and `required`
        type Person = typeof person;
        //   ^?
        // Person: JSONSchemaModelFragmentReflect<Schema, 'Person', Schema['$defs']['Person']> - no narrowing needed
        expect(true satisfies AssertTypeEquality<Person, JSONSchemaModelFragmentReflect<Schema, 'Person', Schema['$defs']['Person']>>).toBe(true);
        expect(person.names).toEqual(['name', 'role', 'nickname', 'mentor']);
        expect(person.required).toEqual(['name', 'role']);

        const name = person.properties.name[0];
        // Breakpoint: inspect `name`, a primitive type reflection with no name of its own (it is nested)
        expect(name).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentReflect);
        expect(name.type).toBe('string');
      });

      it('Reflects a fragment carrying several keywords by a reflection per keyword', () => {
        const role = new JSONSchemaCollectionFragmentReflect(schema).fragment('Role');
        // Breakpoint: inspect `role`, an array holding an enum reflection and a primitive type reflection of the same fragment
        expect(role.map((reflection) => reflection.constructor)).toEqual([JSONSchemaEnumFragmentReflect, JSONSchemaPrimitiveTypeFragmentReflect]);
        type Role = (typeof role)[number];
        //   ^?
        // Role: JSONSchemaEnumFragmentReflect<…> | JSONSchemaPrimitiveTypeFragmentReflect<…> - narrow with `instanceof`
        const enumeration = role.find((reflection) => reflection instanceof JSONSchemaEnumFragmentReflect);
        expect(enumeration?.enum).toEqual(['student', 'teacher']);
        expect(true satisfies AssertTypeEquality<Role extends JSONSchemaFragmentReflect<Schema, 'Role', any> ? true : false, true>).toBe(true);
      });

      it('Infers the value type of any reflection, through its type-only Type accessor', () => {
        const person = new JSONSchemaCollectionFragmentReflect(schema).fragment('Person')[0];
        type PersonType = typeof person.Type;
        //   ^?
        // PersonType: { name: string; role: 'student' | 'teacher'; nickname: string | null; mentor: PersonType | null }
        expect(true satisfies AssertTypeEquality<PersonType['role'], 'student' | 'teacher'>).toBe(true);
        expect(true satisfies AssertTypeEquality<PersonType['mentor'], PersonType | null>).toBe(true);
        // `Type` holds no value: it throws if accessed at runtime
        expect(() => person.Type).toThrow();
      });
    });

    describe('References', () => {
      it('Resolves references lazily, against the reflections the collection holds', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(schema);
        const role = collection.fragment('Person')[0].properties.role[0];
        // Breakpoint: inspect `role`, a reference reflection: `refName` is parsed on construction, `ref` is only resolved when accessed
        expect(role).toBeInstanceOf(JSONSchemaReferenceFragmentReflect);
        expect(role.refName).toBe('Role');
        expect(role.ref).toBe(collection.fragment('Role'));
      });

      it('Resolves a recursive reference, as it is never resolved eagerly', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(schema);
        const person = collection.fragment('Person')[0];
        const mentor = person.properties.mentor[0].anyOf[0][0].ref[0];
        // Breakpoint: inspect `mentor`, the very same reflection as `person`
        expect(mentor).toBe(person);
      });
    });

    describe('Type arrays', () => {
      it('Splits a type array naming object, array and / or null into branches', () => {
        const branches = getJSONSchemaFragmentTypeBranches(schema.$defs.Person.properties.nickname);
        // Breakpoint: inspect `branches`, the runtime counterpart of `JSONSchemaFragmentTypeBranch`
        expect(branches).toEqual([{ type: 'null' }, { type: ['string'] }]);
      });

      it('Reflects several branches as an implicit anyOf', () => {
        const nickname = new JSONSchemaCollectionFragmentReflect(schema).fragment('Person')[0].properties.nickname[0];
        // Breakpoint: inspect `nickname`, an any-of-types reflection with `implicit: true`, holding a reflection of each branch
        expect(nickname).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentReflect);
        expect(nickname.implicit).toBe(true);
        expect(nickname.anyOf.map(([branch]) => branch.constructor)).toEqual([JSONSchemaNullTypeFragmentReflect, JSONSchemaPrimitiveTypeFragmentReflect]);
        type Nickname = typeof nickname.Type;
        //   ^?
        // Nickname: string | null
        expect(true satisfies AssertTypeEquality<Nickname, string | null>).toBe(true);
      });
    });

    describe('The router', () => {
      it('Reflects any fragment, by every reflection class it matches', () => {
        // Every reflection class has a static `check` type guard, the runtime counterpart of `JSONSchemaFragmentIs*`, which the router tries in turn
        const collection = new JSONSchemaCollectionFragmentReflect(schema);
        const reflections = createJSONSchemaFragmentReflections(collection, undefined, { type: 'array', items: { type: 'integer' } } as const);
        // Breakpoint: inspect `reflections`, a single array type reflection, its `items` reflected in turn
        expect(reflections[0]).toBeInstanceOf(JSONSchemaArrayTypeFragmentReflect);
        expect(JSONSchemaArrayTypeFragmentReflect.check({ type: 'array' })).toBe(true);
        type Items = (typeof reflections)[0]['items'];
        //   ^?
        // Items: Array<JSONSchemaPrimitiveTypeFragmentReflect<Schema, undefined, { readonly type: 'integer' }>>
        expect(true satisfies AssertTypeEquality<Items, Array<JSONSchemaPrimitiveTypeFragmentReflect<Schema, undefined, { readonly type: 'integer' }>>>).toBe(
          true,
        );
      });

      it('Reflects a fragment matching no reflection class with no reflections', () => {
        const reflections = createJSONSchemaFragmentReflections(new JSONSchemaCollectionFragmentReflect(schema), undefined, { title: 'Annotation' } as const);
        // Breakpoint: inspect `reflections`, empty: annotations alone constrain nothing
        expect(reflections).toEqual([]);
      });
    });
  });
});
