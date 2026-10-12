/**
 * Showcase of everything TSschema exports, as a runnable test file, in the three sections of the README's Usage: runtime reflection, code generation
 * (schemas from JSON files) and type inference.
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
import {
  reflect,
  type TSSchemaCollection,
  type TSSchemaFragment,
  type TSSchemaProperty,
  type TSSchemaName,
  type TSSchemaType,
  type TSSchemaJSONCollection,
  type TSSchemaTypeDescriptor,
  type TSSchemaPrimitiveTypeDescriptor,
} from './index.js';
import { generateFiles } from './codegen/index.js';

// #region The schema

/**
 * The schema every example below works with: a collection defining its fragments in `$defs`, which reference one another as `#/$defs/<name>`. It is
 * declared `as const`, so its literal types are kept for inference (for a schema kept in a `.json` file, see "Code generation" below).
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
      required: ['name', 'age', 'role'],
    },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;

// #endregion

describe('Runtime reflection', () => {
  describe('reflect', () => {
    it('Reflects a schema, and the names of its definitions', () => {
      const root = reflect(schema);
      const definitionNames = root.definitionNames;
      // Breakpoint: inspect `root`, the reflection of the schema's root, and its `collection`, the facet holding every definition
      expect(definitionNames).toEqual(['Person', 'Role']);
      type DefinitionName = (typeof definitionNames)[number];
      //   ^?
      // DefinitionName: 'Person' | 'Role'
      expect(true satisfies AssertTypeEquality<DefinitionName, 'Person' | 'Role'>).toBe(true);
    });
  });

  describe('Definitions', () => {
    it('Reflects a definition by name, typed by its value type', () => {
      const root = reflect(schema);
      const person = root.getDefinition('Person');
      // Breakpoint: inspect `person`, and the `facets` its definition was parsed into
      expect(person.name).toBe('Person');
      type PersonValue = typeof person.Type;
      //   ^?
      // PersonValue: { name: string; age: number; role: 'student' | 'teacher'; mentor?: PersonValue | null }
      expect(true satisfies AssertTypeEquality<PersonValue, TSSchemaType<TSSchemaFragment<Schema, 'Person'>>>).toBe(true);

      // @ts-expect-error This will fail at compile time: the collection has no 'Teacher' definition
      root.getDefinition('Teacher');
    });
  });

  describe('Properties and paths', () => {
    it('Reflects a property by name, with its parent and whether it is required', () => {
      const person = reflect(schema).getDefinition('Person');
      const propertyNames = person.propertyNames;
      expect(propertyNames).toEqual(['name', 'age', 'role', 'mentor']);
      const personAge = person.getProperty('age');
      // Breakpoint: inspect `personAge`, its `parent` (the very same `person`) and its `facets`
      expect(personAge.name).toBe('age');
      expect(personAge.parent).toBe(person);
      expect(personAge.required).toBe(true);
      type AgeValue = typeof personAge.Type;
      //   ^?
      // AgeValue: number
      expect(true satisfies AssertTypeEquality<AgeValue, number>).toBe(true);

      // @ts-expect-error This will fail at compile time: Person has no 'email' property
      person.getProperty('email');
    });

    it('Reflects a property of a nested model by a dot-separated path', () => {
      const person = reflect(schema).getDefinition('Person');
      // The path goes through the nullable `mentor` reference (an `anyOf` of a `$ref` to Person and `null`)
      const mentorAge = person.getProperty('mentor.age');
      const mentor = mentorAge.parent;
      // Breakpoint: inspect `mentorAge`, and its `parent`: the `mentor` property, whose own `parent` is `person`
      expect([mentor.name, mentor.required, mentor.parent]).toEqual(['mentor', false, person]);
      type MentorAgeValue = typeof mentorAge.Type;
      //   ^?
      // MentorAgeValue: number
      expect(true satisfies AssertTypeEquality<MentorAgeValue, number>).toBe(true);

      // Only a path's first segment is checked at compile time; a path which leads to no property reflects `undefined`
      const nameLength = person.getProperty('name.length');
      // Breakpoint: inspect `nameLength`, undefined as `name` is not a model
      expect(nameLength).toBe(undefined);
      type NameLength = typeof nameLength;
      //   ^?
      // NameLength: undefined
      expect(true satisfies AssertTypeEquality<NameLength, undefined>).toBe(true);
    });
  });

  describe('Type descriptors', () => {
    it('Describes the type of a reflection at runtime, typed by the schema', () => {
      const root = reflect(schema);
      const person = root.getDefinition('Person');
      const personType = person.typeDescriptor;
      // Breakpoint: inspect `personType`, a model descriptor holding a descriptor per property
      expect(personType.kind).toBe('model');
      expect(personType.required).toEqual(['name', 'age', 'role']);
      const ageType = personType.properties.age;
      expect(ageType).toEqual({ kind: 'primitive', type: 'integer' });
      type AgeType = typeof ageType;
      //   ^?
      // AgeType: TSSchemaPrimitiveTypeDescriptor<'integer'>
      expect(true satisfies AssertTypeEquality<AgeType, TSSchemaPrimitiveTypeDescriptor<'integer'>>).toBe(true);

      // A `$ref` is described by name, and lazily by its `target`: the very same descriptor as the definition's own, within one reflected schema
      const roleType = personType.properties.role;
      // Breakpoint: inspect `roleType`, and its `target`: an enum descriptor
      expect([roleType.kind, roleType.name]).toEqual(['reference', 'Role']);
      expect(roleType.target).toBe(root.getDefinition('Role').typeDescriptor);
      const roleNames = roleType.target.names;
      expect(roleNames).toEqual(['student', 'teacher']);
      type RoleNames = typeof roleNames;
      //   ^?
      // RoleNames: readonly ['student', 'teacher']
      expect(true satisfies AssertTypeEquality<RoleNames, readonly ['student', 'teacher']>).toBe(true);

      const mentorType = personType.properties.mentor;
      // Breakpoint: inspect `mentorType`, an anyOf of a reference back to Person and null
      expect(mentorType.members.map((member) => member.kind)).toEqual(['reference', 'null']);

      // @ts-expect-error This will fail at compile time: Person has no 'email' property
      expect(personType.properties.email).toBe(undefined);
    });

    it('Narrows any descriptor by its kind', () => {
      function typeName(descriptor: TSSchemaTypeDescriptor): string {
        switch (descriptor.kind) {
          case 'primitive':
            return descriptor.type;
          case 'reference':
            return descriptor.name;
          case 'array':
            return `${typeName(descriptor.items)}[]`;
          default:
            return descriptor.kind;
        }
      }
      const person = reflect(schema).getDefinition('Person');
      const names = person.propertyNames.map((name) => typeName(person.getProperty(name).typeDescriptor));
      // Breakpoint: inspect `names`
      expect(names).toEqual(['string', 'integer', 'Role', 'anyOf']);
    });
  });

  describe('Coming next', () => {
    it.todo('Validates values against a reflected schema');
    it.todo('Supports the readOnly and writeOnly keywords');
    it.todo('Describes tuples and additionalProperties');
  });
});

describe('Code generation: Schemas from JSON files', () => {
  describe('Schemas declared as const', () => {
    it('Checks a schema declared as const, without losing its literal types', () => {
      // Apply `satisfies` to the declared constant rather than to the literal, so keywords these types do not know are not rejected as excess properties
      const people = { $defs: { Person: { type: 'object', properties: { name: { type: 'string' } } } } } as const;
      const checkedPeople = people satisfies TSSchemaJSONCollection;
      // Breakpoint: inspect `checkedPeople`, the very same object as `people`
      expect(checkedPeople).toBe(people);
      expect(true satisfies AssertTypeEquality<TSSchemaType<TSSchemaFragment<typeof checkedPeople, 'Person'>>, { name?: string }>).toBe(true);

      const invalid = { $defs: { Person: { type: 'text' } } } as const;
      // @ts-expect-error This will fail at compile time: 'text' is not a JSON schema type
      const _checkedInvalid = invalid satisfies TSSchemaJSONCollection;
    });
  });

  describe('Programmatic use', () => {
    it('Generates a sidecar declaration file, keeping the literal types of a JSON schema file', () => {
      // `generateFiles` is the pure core of the `tsschema` command (generating the very same files): JSON in, files out, no file system access
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

describe('Type inference', () => {
  describe('TSSchemaCollection', () => {
    it('Wraps a collection', () => {
      // A wrapped collection is what every other wrapper carries along, so that `$ref`s can be resolved later
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
      expect(true satisfies AssertTypeEquality<Person['__definitionName'], 'Person'>).toBe(true);
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

    it('Checks definition names against the collection', () => {
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
      // Direct names only, never dot-separated paths: a recursive schema (Person.mentor -> Person) has infinitely many of them
      type DefinitionName = TSSchemaName<Schema>;
      //   ^?
      // DefinitionName: 'Person' | 'Role'
      expect(true satisfies AssertTypeEquality<DefinitionName, 'Person' | 'Role'>).toBe(true);
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
      // PersonType: { name: string; age: number; role: 'student' | 'teacher'; mentor?: PersonType | null }
      expect(true satisfies AssertTypeEquality<PersonType['name'], string>).toBe(true);
      expect(true satisfies AssertTypeEquality<PersonType['age'], number>).toBe(true);
      expect(true satisfies AssertTypeEquality<PersonType['role'], 'student' | 'teacher'>).toBe(true);
      // `mentor` is not listed in `required`, so it is optional
      expect(true satisfies AssertTypeEquality<Pick<PersonType, 'mentor'>, { mentor?: PersonType | null }>).toBe(true);

      const ada: PersonType = { name: 'Ada', age: 36, role: 'teacher', mentor: { name: 'Charles', age: 45, role: 'teacher' } };
      // Breakpoint: inspect `ada`, a value checked against the inferred type
      expect(ada.mentor?.name).toBe('Charles');

      // @ts-expect-error This will fail at compile time: `name` is listed in `required`
      const _nameless: PersonType = { age: 36, role: 'teacher' };
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
});
