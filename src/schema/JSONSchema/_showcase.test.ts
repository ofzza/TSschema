/**
 * Showcase of the internal JSON schema fragment type utilities, the building blocks every public type in `src/schema/` is built from. Never public: meant
 * for understanding the inner workings of the library before changing them (see CONTRIBUTE.md).
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Every claim is asserted with `AssertTypeEquality`, so this file fails `npm test` the moment the utilities stop behaving as shown.
 * - This layer is type-only, so there is little to see at runtime; the few runtime values are each followed by a `// Breakpoint:` comment.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type {
  JSONSchemaArrayTypeFragmentType,
  JSONSchemaCollection,
  JSONSchemaConstFragmentType,
  JSONSchemaEnumFragmentType,
  JSONSchemaFragmentIsArrayType,
  JSONSchemaFragmentIsCollection,
  JSONSchemaFragmentIsModel,
  JSONSchemaFragmentIsPrimitiveType,
  JSONSchemaDefinitionName,
  JSONSchemaFragmentPropertyName,
  JSONSchemaFragmentType,
  JSONSchemaFragmentTypeBranch,
  JSONSchemaModelFragmentType,
  JSONSchemaPrimitiveTypeFromName,
  JSONSchemaPrimitiveTypeFragmentType,
  JSONSchemaReferenceFragmentType,
} from './index.js';

/**
 * The schema the examples below work with
 */
const schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        nickname: { type: ['string', 'null'] },
        role: { $ref: '#/$defs/Role' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'role', 'tags'],
    },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;

describe('Showcase', () => {
  describe('JSONSchema type utilities', () => {
    describe('Collections and their fragments', () => {
      it('Tells a collection (a schema with $defs) apart from a fragment, and gets its definition names', () => {
        type IsCollection = JSONSchemaFragmentIsCollection<Schema>;
        //   ^?
        // IsCollection: true
        expect(true satisfies AssertTypeEquality<IsCollection, true>).toBe(true);
        type FragmentName = JSONSchemaDefinitionName<Schema>;
        //   ^?
        // FragmentName: 'Person' | 'Role'
        expect(true satisfies AssertTypeEquality<FragmentName, 'Person' | 'Role'>).toBe(true);

        const checked = schema satisfies JSONSchemaCollection;
        // Breakpoint: inspect `checked`, the schema itself: these utilities are all compile-time, with nothing to compute at runtime
        expect(checked).toBe(schema);
      });
    });

    describe('One utility trio per keyword', () => {
      it('Detects a fragment kind with JSONSchemaFragmentIs*', () => {
        // Every per-keyword file defines `JSONSchema<Kind>Fragment` (its shape), `JSONSchemaFragmentIs<Kind>` and `JSONSchema<Kind>FragmentType`
        type IsModel = JSONSchemaFragmentIsModel<Schema['$defs']['Person']>;
        //   ^?
        // IsModel: true
        expect(true satisfies AssertTypeEquality<IsModel, true>).toBe(true);
        type IsArray = JSONSchemaFragmentIsArrayType<Schema['$defs']['Person']['properties']['tags']>;
        //   ^?
        // IsArray: true
        expect(true satisfies AssertTypeEquality<IsArray, true>).toBe(true);
        // A type array naming `null` is not a primitive type: it is split into branches first (see below)
        type IsPrimitive = JSONSchemaFragmentIsPrimitiveType<Schema['$defs']['Person']['properties']['nickname']>;
        //   ^?
        // IsPrimitive: false
        expect(true satisfies AssertTypeEquality<IsPrimitive, false>).toBe(true);
      });

      it('Infers the type contributed by a single keyword with JSONSchema*FragmentType', () => {
        type Primitive = JSONSchemaPrimitiveTypeFragmentType<{ readonly type: readonly ['string', 'integer'] }>;
        //   ^?
        // Primitive: string | number
        expect(true satisfies AssertTypeEquality<Primitive, string | number>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'boolean'>, boolean>).toBe(true);
        type Enum = JSONSchemaEnumFragmentType<Schema['$defs']['Role']>;
        //   ^?
        // Enum: 'student' | 'teacher'
        expect(true satisfies AssertTypeEquality<Enum, 'student' | 'teacher'>).toBe(true);
        type Const = JSONSchemaConstFragmentType<{ readonly const: 42 }>;
        //   ^?
        // Const: 42
        expect(true satisfies AssertTypeEquality<Const, 42>).toBe(true);
        type Tags = JSONSchemaArrayTypeFragmentType<Schema['$defs']['Person']['properties']['tags']>;
        //   ^?
        // Tags: string[]
        expect(true satisfies AssertTypeEquality<Tags, string[]>).toBe(true);
      });

      it('Infers unknown, i.e. no constraint, from a keyword that is absent', () => {
        type NoEnum = JSONSchemaEnumFragmentType<{ readonly type: 'string' }>;
        //   ^?
        // NoEnum: unknown
        expect(true satisfies AssertTypeEquality<NoEnum, unknown>).toBe(true);
      });
    });

    describe('Models', () => {
      it('Gets the property names of a model, and infers its type', () => {
        type PropertyName = JSONSchemaFragmentPropertyName<Schema['$defs']['Person']>;
        //   ^?
        // PropertyName: 'name' | 'nickname' | 'role' | 'tags'
        expect(true satisfies AssertTypeEquality<PropertyName, 'name' | 'nickname' | 'role' | 'tags'>).toBe(true);
        // A property not listed in `required` (here, `nickname`) is optional. Without a collection, a `$ref` can not be resolved and infers `unknown`
        type Person = JSONSchemaModelFragmentType<Schema['$defs']['Person']>;
        //   ^?
        // Person: { name: string; nickname?: string | null; role: unknown; tags: string[] }
        expect(true satisfies AssertTypeEquality<Person, { name: string; nickname?: string | null; role: unknown; tags: string[] }>).toBe(true);
      });
    });

    describe('References', () => {
      it('Resolves a reference against a collection', () => {
        type Role = JSONSchemaReferenceFragmentType<{ readonly $ref: '#/$defs/Role' }, Schema>;
        //   ^?
        // Role: 'student' | 'teacher'
        expect(true satisfies AssertTypeEquality<Role, 'student' | 'teacher'>).toBe(true);
        type Unresolved = JSONSchemaReferenceFragmentType<{ readonly $ref: '#/$defs/Role' }>;
        //   ^?
        // Unresolved: unknown
        expect(true satisfies AssertTypeEquality<Unresolved, unknown>).toBe(true);
      });
    });

    describe('Any fragment', () => {
      it('Intersects the types of every keyword a fragment carries', () => {
        // `JSONSchemaFragmentType` dispatches to every per-keyword type and intersects them, so sibling keywords narrow each other
        type Narrowed = JSONSchemaFragmentType<{ readonly type: 'string'; readonly enum: readonly ['a', 'b', 1] }>;
        //   ^?
        // Narrowed: 'a' | 'b'
        expect(true satisfies AssertTypeEquality<Narrowed, 'a' | 'b'>).toBe(true);
        type Conflicting = JSONSchemaFragmentType<{ readonly type: 'string'; readonly const: 1 }>;
        //   ^?
        // Conflicting: never
        expect(true satisfies AssertTypeEquality<Conflicting, never>).toBe(true);
      });

      it('Infers a fragment of a collection, resolving every reference', () => {
        type Person = JSONSchemaFragmentType<Schema['$defs']['Person'], Schema>;
        //   ^?
        // Person: { name: string; nickname?: string | null; role: 'student' | 'teacher'; tags: string[] }
        expect(true satisfies AssertTypeEquality<Person, { name: string; nickname?: string | null; role: 'student' | 'teacher'; tags: string[] }>).toBe(true);
      });
    });

    describe('Type array branches', () => {
      it('Splits a type array naming object, array and / or null into a branch per group of type names', () => {
        type Branch = JSONSchemaFragmentTypeBranch<{ readonly type: readonly ['object', 'string', 'integer', 'null']; readonly title: 'x' }>;
        //   ^?
        // Branch: { type: 'object'; title: 'x' } | { type: 'null'; title: 'x' } | { type: Array<'string' | 'integer'>; title: 'x' } (all readonly)
        expect(
          true satisfies AssertTypeEquality<
            Branch,
            | { readonly type: 'object'; readonly title: 'x' }
            | { readonly type: 'null'; readonly title: 'x' }
            | { readonly type: Array<'string' | 'integer'>; readonly title: 'x' }
          >,
        ).toBe(true);
      });

      it('Infers the union of the types of the branches, as alternatives', () => {
        type NullableModel = {
          readonly type: readonly ['object', 'null'];
          readonly properties: { readonly a: { readonly type: 'number' } };
          readonly required: readonly ['a'];
        };
        type Nullable = JSONSchemaFragmentType<NullableModel>;
        //   ^?
        // Nullable: { a: number } | null
        expect(true satisfies AssertTypeEquality<Nullable, { a: number } | null>).toBe(true);
      });
    });
  });
});
