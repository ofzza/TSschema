/**
 * Showcase of everything TSschema exports, as a runnable test file.
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it, live. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Every type claim is also asserted with `AssertTypeEquality`, and every "This will fail at compile time" example is marked `@ts-expect-error`, so this
 *   file can never fall out of date: it fails `npm test` the moment the library stops behaving as shown.
 * - Runtime examples assign their results to named constants, each followed by a `// Breakpoint:` comment: put a breakpoint there and run this file with
 *   the "TS: Debug Current Test File" launch configuration to inspect them.
 *
 * Imports only from the public entry points: `@ofzza/tsschema` (here `./index.js`) and `@ofzza/tsschema/codegen` (here `./codegen/index.js`).
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { TSSchemaCollection, TSSchemaFragment, TSSchemaProperty, TSSchemaName, TSSchemaType, TSSchemaJSONCollection } from './index.js';
import { generateFiles } from './codegen/index.js';

// #region The schema

/**
 * The schema every example below works with: a collection defining its fragments in `$defs`, which reference one another as `#/$defs/<name>`. It is
 * declared `as const`, so its literal types are kept for inference (for a schema kept in a `.json` file, see "Schemas from JSON files" below).
 */
const schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        role: { $ref: '#/$defs/Role' },
        mentor: { anyOf: [{ $ref: '#/$defs/Person' }, { type: 'null' }] },
      },
    },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;

// #endregion

describe('Showcase', () => {
  describe('TSSchemaCollection', () => {
    it('Wraps a collection', () => {
      // A wrapped collection is the context every other wrapper carries along, so that `$ref`s can be resolved later
      type People = TSSchemaCollection<Schema>;
      //   ^?
      // People: { __collection: Schema }
      expect(true satisfies AssertTypeEquality<People['__collection'], Schema>).toBe(true);
    });
  });

  describe('TSSchemaFragment', () => {
    it('Wraps a fragment of a collection, addressed by name', () => {
      type Person = TSSchemaFragment<TSSchemaCollection<Schema>, 'Person'>;
      //   ^?
      // Person: a wrapper of Schema['$defs']['Person'], remembering its collection and its name
      expect(true satisfies AssertTypeEquality<Person['__fragment'], Schema['$defs']['Person']>).toBe(true);
      expect(true satisfies AssertTypeEquality<Person['__fragmentName'], 'Person'>).toBe(true);
    });

    it('Wraps several fragments, or every fragment, as a union of wrappers', () => {
      type PersonOrRole = TSSchemaFragment<Schema, 'Person' | 'Role'>;
      //   ^?
      // PersonOrRole: TSSchemaFragment<Schema, 'Person'> | TSSchemaFragment<Schema, 'Role'>
      expect(true satisfies AssertTypeEquality<PersonOrRole, TSSchemaFragment<Schema, 'Person'> | TSSchemaFragment<Schema, 'Role'>>).toBe(true);
      type AnyFragment = TSSchemaFragment<Schema>;
      //   ^?
      // AnyFragment: TSSchemaFragment<Schema, 'Person'> | TSSchemaFragment<Schema, 'Role'>
      expect(true satisfies AssertTypeEquality<AnyFragment, PersonOrRole>).toBe(true);
    });

    it('Checks fragment names against the collection', () => {
      // @ts-expect-error This will fail at compile time: the collection has no 'Teacher' fragment
      type _Teacher = TSSchemaFragment<Schema, 'Teacher'>;
    });

    it('Wraps a fragment given directly, with no collection to resolve its $refs against', () => {
      type StandalonePerson = TSSchemaFragment<Schema['$defs']['Person']>;
      //   ^?
      // StandalonePerson: a wrapper of the Person fragment alone
      expect(true satisfies AssertTypeEquality<StandalonePerson['__fragment'], Schema['$defs']['Person']>).toBe(true);
    });
  });

  describe('TSSchemaProperty', () => {
    it('Wraps a property of a model, addressed by name', () => {
      // From a fragment wrapper, from a collection by model and property name, or from a model given directly
      type PersonName = TSSchemaProperty<TSSchemaFragment<Schema, 'Person'>, 'name'>;
      //   ^?
      // PersonName: a wrapper of the `name` property, together with the Person model it belongs to
      type PersonAge = TSSchemaProperty<Schema, 'Person', 'age'>;
      //   ^?
      // PersonAge: a wrapper of the `age` property of Person
      type StandalonePersonRole = TSSchemaProperty<Schema['$defs']['Person'], 'role'>;
      //   ^?
      // StandalonePersonRole: a wrapper of the `role` property, with no collection
      expect(true satisfies AssertTypeEquality<PersonName['__property'], { readonly type: 'string' }>).toBe(true);
      expect(true satisfies AssertTypeEquality<PersonAge['__propertyName'], 'age'>).toBe(true);
      expect(true satisfies AssertTypeEquality<StandalonePersonRole['__property'], { readonly $ref: '#/$defs/Role' }>).toBe(true);
    });

    it('Checks property names against the model', () => {
      // @ts-expect-error This will fail at compile time: Person has no 'email' property
      type _PersonEmail = TSSchemaProperty<TSSchemaFragment<Schema, 'Person'>, 'email'>;
    });

    it('Wraps a property of a nested model, addressed by a dot-separated path', () => {
      // A path goes into a `$ref`, through every member of an `anyOf` (here, the nullable mentor), into array `items`, ...
      type MentorName = TSSchemaProperty<TSSchemaFragment<Schema, 'Person'>, 'mentor.name'>;
      //   ^?
      // MentorName: the same wrapper as TSSchemaProperty<Schema, 'Person', 'name'>
      expect(true satisfies AssertTypeEquality<MentorName, TSSchemaProperty<Schema, 'Person', 'name'>>).toBe(true);
      type MentorMentorAge = TSSchemaProperty<Schema, 'Person', 'mentor.mentor.age'>;
      //   ^?
      // MentorMentorAge: the same wrapper as TSSchemaProperty<Schema, 'Person', 'age'>
      expect(true satisfies AssertTypeEquality<MentorMentorAge, TSSchemaProperty<Schema, 'Person', 'age'>>).toBe(true);
    });

    it('Infers never from a path which does not address a property', () => {
      // Only a path's first segment is checked at compile time; the rest is resolved, or infers `never`
      type MentorEmail = TSSchemaProperty<Schema, 'Person', 'mentor.email'>;
      //   ^?
      // MentorEmail: never
      expect(true satisfies AssertTypeEquality<MentorEmail, never>).toBe(true);
    });
  });

  describe('TSSchemaName', () => {
    it('Infers the names addressable within a collection, a model or a wrapper', () => {
      type FragmentName = TSSchemaName<Schema>;
      //   ^?
      // FragmentName: 'Person' | 'Role'
      expect(true satisfies AssertTypeEquality<FragmentName, 'Person' | 'Role'>).toBe(true);
      type PropertyName = TSSchemaName<TSSchemaFragment<Schema, 'Person'>>;
      //   ^?
      // PropertyName: 'name' | 'age' | 'role' | 'mentor'
      expect(true satisfies AssertTypeEquality<PropertyName, 'name' | 'age' | 'role' | 'mentor'>).toBe(true);
      type SiblingPropertyName = TSSchemaName<TSSchemaProperty<Schema, 'Person', 'age'>>;
      //   ^?
      // SiblingPropertyName: 'name' | 'age' | 'role' | 'mentor'
      expect(true satisfies AssertTypeEquality<SiblingPropertyName, PropertyName>).toBe(true);
      type RoleName = TSSchemaName<TSSchemaFragment<Schema, 'Role'>>;
      //   ^?
      // RoleName: never (Role is not a model)
      expect(true satisfies AssertTypeEquality<RoleName, never>).toBe(true);
    });
  });

  describe('TSSchemaType', () => {
    it('Infers the value type of a fragment, resolving every $ref against its collection', () => {
      type PersonType = TSSchemaType<TSSchemaFragment<Schema, 'Person'>>;
      //   ^?
      // PersonType: { name: string; age: number; role: 'student' | 'teacher'; mentor: PersonType | null }
      expect(true satisfies AssertTypeEquality<PersonType['name'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<PersonType['age'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<PersonType['role'], 'student' | 'teacher'>).toBe(true);
      expect(true satisfies AssertTypeEquality<PersonType['mentor'], PersonType | null>).toBe(true);

      const person: PersonType = { name: 'Ada', age: 36, role: 'teacher', mentor: { name: 'Charles', age: 45, role: 'teacher', mentor: null } };
      // Breakpoint: inspect `person`, a value checked against the inferred type
      expect(person.mentor?.name).toBe('Charles');
    });

    it('Infers the value type of a property, also when addressed by path', () => {
      type AgeType = TSSchemaType<TSSchemaProperty<Schema, 'Person', 'age'>>;
      //   ^?
      // AgeType: number
      expect(true satisfies AssertTypeEquality<AgeType, number>).toBe(true);
      type MentorAgeType = TSSchemaType<TSSchemaProperty<Schema, 'Person', 'mentor.mentor.age'>>;
      //   ^?
      // MentorAgeType: number
      expect(true satisfies AssertTypeEquality<MentorAgeType, number>).toBe(true);
      type RoleType = TSSchemaType<TSSchemaProperty<Schema, 'Person', 'role'>>;
      //   ^?
      // RoleType: 'student' | 'teacher'
      expect(true satisfies AssertTypeEquality<RoleType, 'student' | 'teacher'>).toBe(true);

      // @ts-expect-error This will fail at compile time: 'principal' is not a role
      const _role: RoleType = 'principal';
    });

    it('Resolves $refs only against a known collection, or one passed explicitly', () => {
      type UnresolvedRoleType = TSSchemaType<TSSchemaProperty<Schema['$defs']['Person'], 'role'>>;
      //   ^?
      // UnresolvedRoleType: unknown (no collection to resolve the $ref against)
      expect(true satisfies AssertTypeEquality<UnresolvedRoleType, unknown>).toBe(true);
      type ResolvedRoleType = TSSchemaType<TSSchemaProperty<Schema['$defs']['Person'], 'role'>, Schema>;
      //   ^?
      // ResolvedRoleType: 'student' | 'teacher'
      expect(true satisfies AssertTypeEquality<ResolvedRoleType, 'student' | 'teacher'>).toBe(true);
    });
  });

  describe('TSSchemaJSONSchema and TSSchemaJSONCollection', () => {
    it('Checks a schema declared as const, without losing its literal types', () => {
      // Apply `satisfies` to the declared constant rather than to the literal, so keywords these types do not know are not rejected as excess properties
      const people = { $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } } } as const;
      const checkedPeople = people satisfies TSSchemaJSONCollection;
      // Breakpoint: inspect `checkedPeople`, the very same object as `people`
      expect(checkedPeople).toBe(people);
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaFragment<typeof checkedPeople, 'Person'>>, { name: string }>).toBe(true);

      const invalid = { $defs: { Person: { type: 'text' } } } as const;
      // @ts-expect-error This will fail at compile time: 'text' is not a JSON schema type
      const _checkedInvalid = invalid satisfies TSSchemaJSONCollection;
    });
  });

  describe('Schemas from JSON files', () => {
    it('Generates a sidecar declaration file, keeping the literal types of a JSON schema file', () => {
      // `generateFiles` is the pure core of the `tsschema` command: JSON in, files out, no file system access
      const files = generateFiles('src/people.json', schema);
      // Breakpoint: inspect `files`, a single `src/people.d.json.ts` declaring the JSON file's content with its literal types
      expect(files.map((file) => file.path)).toEqual(['src/people.d.json.ts']);
      expect(files[0].content.startsWith('// Generated by TSschema')).toBe(true);
    });

    it('Generates model types for every fragment of a collection', () => {
      const files = generateFiles('src/people.json', schema, { models: true });
      // Breakpoint: inspect `files`, now also `src/people.models.ts`, with a `Models` map type and a `Person` / `Role` type alias each
      expect(files.map((file) => file.path)).toEqual(['src/people.d.json.ts', 'src/people.models.ts']);
      expect(files[1].content).toContain('export type Person = ');
    });

    it('Generates an as const module, or a types-only module, instead', () => {
      const moduleFiles = generateFiles('src/people.json', schema, { mode: 'module' });
      // Breakpoint: inspect `moduleFiles`, a `src/people.schema.ts` exporting the schema `as const`, checked with `satisfies`
      expect(moduleFiles[0].content).toContain('as const');
      const typesFiles = generateFiles('src/people.json', schema, { mode: 'types', importFrom: './index.js' });
      // Breakpoint: inspect `typesFiles`, a `src/people.schema.ts` exporting only the schema's type, as `Schema`
      expect(typesFiles[0].path).toBe('src/people.schema.ts');
      expect(typesFiles[0].content).toContain('export type Schema');
    });
  });
});
