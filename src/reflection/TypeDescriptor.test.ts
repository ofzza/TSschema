import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { parseJSONSchema, parseJSONSchemaCollection } from './JSONSchema/index.js';
import {
  getTSSchemaTypeDescriptor,
  type TSSchemaAllOfTypeDescriptor,
  type TSSchemaAnyOfTypeDescriptor,
  type TSSchemaArrayTypeDescriptor,
  type TSSchemaConstTypeDescriptor,
  type TSSchemaEnumTypeDescriptor,
  type TSSchemaModelPropertyDescriptor,
  type TSSchemaModelTypeDescriptor,
  type TSSchemaNotTypeDescriptor,
  type TSSchemaNullTypeDescriptor,
  type TSSchemaOneOfTypeDescriptor,
  type TSSchemaPrimitiveTypeDescriptor,
  type TSSchemaRecordTypeDescriptor,
  type TSSchemaReferenceTypeDescriptor,
  type TSSchemaTypeDescriptor,
  type TSSchemaTypeDescriptorOf,
  type TSSchemaUnknownTypeDescriptor,
} from './TypeDescriptor.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from '../schema/JSONSchema/index.js';

import { default as enumJsonSchema } from '../../res/sidecar/enum.json';
import { default as jsonSchema } from '../../res/sidecar/schema.json';

/**
 * Describes a schema with no `$defs` at runtime, and infers its descriptor at type level
 */
function _describe<const TFragment extends JSONSchemaNotCollectionFragment>(fragment: TFragment): TSSchemaTypeDescriptorOf<JSONSchemaCollection, TFragment> {
  return getTSSchemaTypeDescriptor(parseJSONSchema(fragment)) as TSSchemaTypeDescriptorOf<JSONSchemaCollection, TFragment>;
}

/**
 * Schema collection with a recursive definition, referenced as is and as nullable
 */
const _schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: { name: { type: 'string' }, mentor: { $ref: '#/$defs/Person' }, buddy: { anyOf: [{ $ref: '#/$defs/Person' }, { type: 'null' }] } },
      required: ['name'],
    },
  },
} as const;
type _Schema = typeof _schema;

/**
 * Descriptor of a string which is not nullable
 */
type _String = TSSchemaPrimitiveTypeDescriptor<'string', false>;

describe('Reflection', () => {
  // Type descriptors (TypeDescriptor.ts): getTSSchemaTypeDescriptor, building one from a fragment's facets, and its type-level mirror TSSchemaTypeDescriptorOf.
  // Most cases describe an inline fragment with `_describe` (parsed with no collection, and inferred under the unspecified collection), asserting the runtime
  // descriptor with `toEqual` next to an `AssertTypeEquality` on its inferred type. References use the recursive `_schema` collection above, and named enums
  // the res/sidecar/enum.json and schema.json fixtures.
  describe('TypeDescriptor', () => {
    // The runtime builder with its inferred types, then what only the type-level mirror does.
    describe('getTSSchemaTypeDescriptor', () => {
      // One case per descriptor kind and per rule combining facets: extracting `null` into the `nullable` flag, absorbing a type next to an enum or const,
      // implicit `anyOf` / `allOf`, lazy references and caching.
      it('Describes a fragment with no type keywords as unknown', () => {
        // A fragment holding only annotations parses into no facets.
        const descriptor = _describe({ description: 'Anything' });
        expect(descriptor).toEqual({ kind: 'unknown', nullable: false });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaUnknownTypeDescriptor<false>>).toBe(true);
      });

      it('Describes a constant, and a null constant as the null type', () => {
        // A `null` constant is the `null` kind rather than a nullable constant (see AGENTS.md › null is a flag (nullable), never an alternative).
        const descriptor = _describe({ const: 'a' });
        expect(descriptor).toEqual({ kind: 'const', value: 'a', nullable: false });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaConstTypeDescriptor<'a', false>>).toBe(true);

        const nullConst = _describe({ const: null });
        expect(nullConst).toEqual({ kind: 'null', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof nullConst, TSSchemaNullTypeDescriptor>).toBe(true);
      });

      it('Describes an enum, naming each value by its own name', () => {
        const descriptor = _describe({ enum: ['a', 1, true] });
        expect(descriptor).toEqual({ kind: 'enum', values: ['a', 1, true], names: ['a', '1', 'true'], nullable: false });
        expect(
          true satisfies AssertTypeEquality<typeof descriptor, TSSchemaEnumTypeDescriptor<readonly ['a', 1, true], readonly ['a', '1', 'true'], false>>,
        ).toBe(true);
      });

      it('Describes an enum, naming its values by `x-enumNames`', () => {
        // `x-enumNames` is used only if it names every value: one shorter than `enum` is ignored, at runtime and type level alike (see AGENTS.md › Enum names
        // come from x-enumNames, oneOf titles, or the value itself).
        const descriptor = getTSSchemaTypeDescriptor(parseJSONSchemaCollection(enumJsonSchema).$defs.NamedEnum);
        expect(descriptor).toEqual({ kind: 'enum', values: [1, 2, 3], names: ['One', 'Two', 'Three'], nullable: false });
        expect(_describe({ enum: ['a', 'b'], 'x-enumNames': ['A'] })).toEqual({ kind: 'enum', values: ['a', 'b'], names: ['a', 'b'], nullable: false });
        const _named = _describe({ enum: ['a', 'b'], 'x-enumNames': ['A', 'B'] });
        expect(true satisfies AssertTypeEquality<typeof _named, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['A', 'B'], false>>).toBe(true);
        const _misnamed = _describe({ enum: ['a', 'b'], 'x-enumNames': ['A'] });
        expect(true satisfies AssertTypeEquality<typeof _misnamed, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['a', 'b'], false>>).toBe(true);
      });

      it('Extracts a null value of an enum into its nullable flag, together with its name', () => {
        // The name of the `null` value is dropped with it, so that names stay aligned with values.
        const descriptor = _describe({ enum: ['a', null, 'b'], 'x-enumNames': ['A', 'None', 'B'] });
        expect(descriptor).toEqual({ kind: 'enum', values: ['a', 'b'], names: ['A', 'B'], nullable: true });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['A', 'B'], true>>).toBe(true);

        const onlyNull = _describe({ enum: [null] });
        expect(onlyNull).toEqual({ kind: 'null', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof onlyNull, TSSchemaNullTypeDescriptor>).toBe(true);
      });

      it('Describes a oneOf of constants as an enum, naming its values by their titles', () => {
        // The enum idiom the sibling dotnetschema generates, as in the fixture's `AssessmentKind`: the `type` next to the `oneOf` is absorbed, and a `null`
        // constant member makes the enum nullable (see AGENTS.md › Enum names come from x-enumNames, oneOf titles, or the value itself).
        const descriptor = _describe({ type: 'integer', oneOf: [{ const: 0, title: 'Zero' }, { const: 1 }] });
        expect(descriptor).toEqual({ kind: 'enum', values: [0, 1], names: ['Zero', '1'], nullable: false });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaEnumTypeDescriptor<readonly [0, 1], readonly ['Zero', '1'], false>>).toBe(true);

        const nullable = _describe({
          oneOf: [
            { const: 0, title: 'Zero' },
            { const: null, title: 'None' },
          ],
        });
        expect(nullable).toEqual({ kind: 'enum', values: [0], names: ['Zero'], nullable: true });
        expect(true satisfies AssertTypeEquality<typeof nullable, TSSchemaEnumTypeDescriptor<readonly [0], readonly ['Zero'], true>>).toBe(true);

        const kind = getTSSchemaTypeDescriptor(parseJSONSchemaCollection(jsonSchema).$defs.AssessmentKind);
        expect(kind).toMatchObject({ kind: 'enum', values: [0, 1, 2, 3, 4, 5, 6, 7], nullable: false });
        expect(kind.names.slice(0, 2)).toEqual(['Quiz', 'MidtermExam']);
      });

      it('Describes a oneOf of anything other than only constants as a oneOf, never extracting null from it', () => {
        // A `oneOf` with a `null` member stays a `oneOf`, nullable only if exactly one member is (see AGENTS.md › null is a flag (nullable), never an
        // alternative).
        const descriptor = _describe({ oneOf: [{ const: 0 }, { type: 'string' }] });
        expect(descriptor).toEqual({
          kind: 'oneOf',
          members: [
            { kind: 'const', value: 0, nullable: false },
            { kind: 'primitive', type: 'string', nullable: false },
          ],
          nullable: false,
        });
        expect(
          true satisfies AssertTypeEquality<typeof descriptor, TSSchemaOneOfTypeDescriptor<readonly [TSSchemaConstTypeDescriptor<0, false>, _String], false>>,
        ).toBe(true);

        const withNull = _describe({ oneOf: [{ type: 'string' }, { type: 'null' }] });
        expect(withNull).toEqual({
          kind: 'oneOf',
          members: [
            { kind: 'primitive', type: 'string', nullable: false },
            { kind: 'null', nullable: true },
          ],
          nullable: true,
        });
        expect(true satisfies AssertTypeEquality<typeof withNull, TSSchemaOneOfTypeDescriptor<readonly [_String, TSSchemaNullTypeDescriptor], true>>).toBe(
          true,
        );

        // Both members accept null, so the oneOf rejects it
        const ambiguous = _describe({ oneOf: [{ type: ['string', 'null'] }, { type: 'null' }] });
        expect(ambiguous.nullable).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof ambiguous.nullable, false>).toBe(true);
      });

      it('Describes a primitive type, and several as an implicit anyOf', () => {
        // A type array naming only primitive types is one group, parsed as a single primitive type facet listing them in order, so its members infer as a
        // tuple.
        const string = _describe({ type: 'string' });
        expect(string).toEqual({ kind: 'primitive', type: 'string', nullable: false });
        expect(true satisfies AssertTypeEquality<typeof string, _String>).toBe(true);

        const several = _describe({ type: ['string', 'integer'] });
        expect(several).toEqual({
          kind: 'anyOf',
          members: [
            { kind: 'primitive', type: 'string', nullable: false },
            { kind: 'primitive', type: 'integer', nullable: false },
          ],
          implicit: true,
          nullable: false,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof several,
            TSSchemaAnyOfTypeDescriptor<readonly [_String, TSSchemaPrimitiveTypeDescriptor<'integer', false>], true, false>
          >,
        ).toBe(true);
      });

      it('Describes the null type as always nullable', () => {
        const nullType = _describe({ type: 'null' });
        expect(nullType).toEqual({ kind: 'null', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof nullType, TSSchemaNullTypeDescriptor>).toBe(true);
      });

      it('Extracts null from a type array into the nullable flag of the rest', () => {
        // A type array naming `null` is split into branches (see AGENTS.md › null is not a primitive type), whose `null` branch is extracted like an `anyOf`
        // member.
        const nullable = _describe({ type: ['string', 'null'] });
        expect(nullable).toEqual({ kind: 'primitive', type: 'string', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof nullable, TSSchemaPrimitiveTypeDescriptor<'string', true>>).toBe(true);

        const model = _describe({ type: ['object', 'null'], properties: { id: { type: 'string' } } });
        expect(model).toMatchObject({ kind: 'model', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof model.nullable, true>).toBe(true);

        const several = _describe({ type: ['string', 'integer', 'null'] });
        expect(several).toEqual({
          kind: 'anyOf',
          members: [
            { kind: 'primitive', type: 'string', nullable: false },
            { kind: 'primitive', type: 'integer', nullable: false },
          ],
          implicit: true,
          nullable: true,
        });
        // A type array's branches infer in no particular order, so the members infer as an array rather than a tuple
        expect(
          true satisfies AssertTypeEquality<
            typeof several,
            TSSchemaAnyOfTypeDescriptor<ReadonlyArray<_String | TSSchemaPrimitiveTypeDescriptor<'integer', false>>, true, true>
          >,
        ).toBe(true);
      });

      it('Extracts null from an anyOf into the nullable flag of the rest', () => {
        // Unlike the branches of a type array, an `anyOf` keyword is not implicit, and its members infer as a tuple.
        const single = _describe({ anyOf: [{ type: 'string' }, { type: 'null' }] });
        expect(single).toEqual({ kind: 'primitive', type: 'string', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof single, TSSchemaPrimitiveTypeDescriptor<'string', true>>).toBe(true);

        const several = _describe({ anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'boolean' }] });
        expect(several).toEqual({
          kind: 'anyOf',
          members: [
            { kind: 'primitive', type: 'string', nullable: false },
            { kind: 'primitive', type: 'boolean', nullable: false },
          ],
          implicit: false,
          nullable: true,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof several,
            TSSchemaAnyOfTypeDescriptor<readonly [_String, TSSchemaPrimitiveTypeDescriptor<'boolean', false>], false, true>
          >,
        ).toBe(true);

        const onlyNull = _describe({ anyOf: [{ type: 'null' }] });
        expect(onlyNull).toEqual({ kind: 'null', nullable: true });
        expect(true satisfies AssertTypeEquality<typeof onlyNull, TSSchemaNullTypeDescriptor>).toBe(true);

        // No null member, but a nullable one
        const nested = _describe({ anyOf: [{ type: ['string', 'null'] }, { type: 'boolean' }] });
        expect(nested.nullable).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof nested.nullable, true>).toBe(true);
      });

      it('Describes an array by its items', () => {
        const descriptor = _describe({ type: 'array', items: { type: 'number' } });
        expect(descriptor).toEqual({ kind: 'array', items: { kind: 'primitive', type: 'number', nullable: false }, nullable: false });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaArrayTypeDescriptor<TSSchemaPrimitiveTypeDescriptor<'number', false>, false>>).toBe(
          true,
        );

        const untyped = _describe({ type: 'array' });
        expect(untyped).toEqual({ kind: 'array', items: { kind: 'unknown', nullable: false }, nullable: false });
        expect(true satisfies AssertTypeEquality<typeof untyped, TSSchemaArrayTypeDescriptor<TSSchemaUnknownTypeDescriptor<false>, false>>).toBe(true);
      });

      it('Describes an object with no properties as a record of unknown values', () => {
        const descriptor = _describe({ type: 'object' });
        expect(descriptor).toEqual({ kind: 'record', values: { kind: 'unknown', nullable: false }, nullable: false });
        expect(true satisfies AssertTypeEquality<typeof descriptor, TSSchemaRecordTypeDescriptor<TSSchemaUnknownTypeDescriptor<false>, false>>).toBe(true);
      });

      it('Describes a model by each of its properties, with whether it is required, and the required names', () => {
        // `note` is a boolean schema, which parses into no facets and so is described as unknown. Being required belongs to the property entry, not its type
        // descriptor (see AGENTS.md › A model descriptor's properties hold { required, type } entries).
        const descriptor = _describe({ type: 'object', properties: { id: { type: 'string' }, note: true }, required: ['id'] });
        expect(descriptor).toEqual({
          kind: 'model',
          properties: {
            id: { required: true, type: { kind: 'primitive', type: 'string', nullable: false } },
            note: { required: false, type: { kind: 'unknown', nullable: false } },
          },
          required: ['id'],
          nullable: false,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof descriptor,
            TSSchemaModelTypeDescriptor<
              {
                readonly id: TSSchemaModelPropertyDescriptor<_String, true>;
                readonly note: TSSchemaModelPropertyDescriptor<TSSchemaUnknownTypeDescriptor<false>, false>;
              },
              ReadonlyArray<'id'>,
              false
            >
          >,
        ).toBe(true);
      });

      it('Describes allOf, nullable only if every member is, and not, never nullable', () => {
        // A `not` is never explicitly nullable, whatever it negates (see AGENTS.md › null is a flag (nullable), never an alternative).
        const allOf = _describe({ allOf: [{ type: 'string' }, { const: 'a' }] });
        expect(allOf).toEqual({
          kind: 'allOf',
          members: [
            { kind: 'primitive', type: 'string', nullable: false },
            { kind: 'const', value: 'a', nullable: false },
          ],
          implicit: false,
          nullable: false,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof allOf,
            TSSchemaAllOfTypeDescriptor<readonly [_String, TSSchemaConstTypeDescriptor<'a', false>], false, false>
          >,
        ).toBe(true);

        const nullableAllOf = _describe({ allOf: [{ type: ['string', 'null'] }, { anyOf: [{ const: 'a' }, { type: 'null' }] }] });
        expect(nullableAllOf.nullable).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof nullableAllOf.nullable, true>).toBe(true);

        const not = _describe({ not: { type: 'boolean' } });
        expect(not).toEqual({ kind: 'not', not: { kind: 'primitive', type: 'boolean', nullable: false }, nullable: false });
        expect(true satisfies AssertTypeEquality<typeof not, TSSchemaNotTypeDescriptor<TSSchemaPrimitiveTypeDescriptor<'boolean', false>, false>>).toBe(true);
      });

      it('Absorbs the type alongside an enum or const', () => {
        // The `type` only restates what the enum allows, so the enum alone describes the fragment (see AGENTS.md › Type descriptors are type shaped, facets
        // keyword shaped).
        const enumeration = _describe({ type: 'string', enum: ['a', 'b'] });
        expect(enumeration).toEqual({ kind: 'enum', values: ['a', 'b'], names: ['a', 'b'], nullable: false });
        expect(true satisfies AssertTypeEquality<typeof enumeration, TSSchemaEnumTypeDescriptor<readonly ['a', 'b'], readonly ['a', 'b'], false>>).toBe(true);

        // Nullable only if `null` is enumerated, regardless of the type allowing it
        const nullable = _describe({ type: ['string', 'null'], enum: ['a', null] });
        expect(nullable).toEqual({ kind: 'enum', values: ['a'], names: ['a'], nullable: true });
        expect(true satisfies AssertTypeEquality<typeof nullable, TSSchemaEnumTypeDescriptor<readonly ['a'], readonly ['a'], true>>).toBe(true);
        const notNullable = _describe({ type: ['string', 'null'], enum: ['a'] });
        expect(notNullable.nullable).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof notNullable.nullable, false>).toBe(true);
      });

      it('Describes several keywords of one fragment as an implicit allOf, nullable only if every one is', () => {
        // At type level the facets are a union, with no order, so the members infer as an array rather than a tuple (see AGENTS.md › Type descriptors are type
        // shaped, facets keyword shaped).
        const descriptor = _describe({ type: 'string', not: { const: '' } });
        expect(descriptor).toEqual({
          kind: 'allOf',
          members: [
            { kind: 'primitive', type: 'string', nullable: false },
            { kind: 'not', not: { kind: 'const', value: '', nullable: false }, nullable: false },
          ],
          implicit: true,
          nullable: false,
        });
        expect(
          true satisfies AssertTypeEquality<
            typeof descriptor,
            TSSchemaAllOfTypeDescriptor<ReadonlyArray<_String | TSSchemaNotTypeDescriptor<TSSchemaConstTypeDescriptor<'', false>, false>>, true, false>
          >,
        ).toBe(true);
      });

      it('Describes a reference lazily, by the same descriptor as its definition', () => {
        // `mentor` refers back to `Person`: an eager `target` would never finish describing it, and the cache per facets array is what makes `target` the
        // definition's very descriptor (see AGENTS.md › A reference descriptor's target is a lazy getter).
        const collection = parseJSONSchemaCollection(_schema);
        const person = getTSSchemaTypeDescriptor(collection.$defs.Person);
        expect(person.properties.name).toEqual({ required: true, type: { kind: 'primitive', type: 'string', nullable: false } });
        const mentor = person.properties.mentor.type;
        expect([mentor.kind, mentor.name, mentor.nullable]).toEqual(['reference', 'Person', false]);
        expect(mentor.target).toBe(person);
        expect(mentor.target.properties.mentor.type.target).toBe(person);
        expect(true satisfies AssertTypeEquality<typeof mentor.name, 'Person'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof mentor.target.properties.name.type, _String>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof person.required, ReadonlyArray<'name'>>).toBe(true);
      });

      it('Extracts null next to a reference as a nullable copy, keeping its target lazy and its definition untouched', () => {
        // `buddy` is an `anyOf` of a `Person` reference and `null`. Setting `nullable` in place would leak into every use of the shared, cached descriptors,
        // and copying by spreading would resolve the lazy `target`; hence the checks for a getter on the copy and an untouched definition (see AGENTS.md › null
        // is a flag (nullable), never an alternative).
        const collection = parseJSONSchemaCollection(_schema);
        const person = getTSSchemaTypeDescriptor(collection.$defs.Person);
        const buddy = person.properties.buddy.type;
        expect([buddy.kind, buddy.name, buddy.nullable]).toEqual(['reference', 'Person', true]);
        expect(Object.getOwnPropertyDescriptor(buddy, 'target')?.get).toBeTypeOf('function');
        expect(buddy.target).toBe(person);
        expect(person.nullable).toBe(false);
        expect(person.properties.mentor.type.nullable).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof buddy.nullable, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof buddy.target.nullable, false>).toBe(true);
      });

      it('Describes a reference which can not be resolved as unknown', () => {
        const missing = getTSSchemaTypeDescriptor(parseJSONSchemaCollection({ $defs: { Broken: { $ref: '#/$defs/Missing' } } } as const).$defs.Broken);
        expect(missing).toEqual({ kind: 'unknown', nullable: false });
        expect(true satisfies AssertTypeEquality<typeof missing, TSSchemaUnknownTypeDescriptor<false>>).toBe(true);

        // With no collection known at type level, a reference may or may not resolve; at runtime, with no `$defs`, it never does
        const uncollected = _describe({ $ref: '#/$defs/Missing' });
        expect(uncollected).toEqual({ kind: 'unknown', nullable: false });
        expect(
          true satisfies AssertTypeEquality<
            typeof uncollected,
            TSSchemaReferenceTypeDescriptor<'Missing', TSSchemaTypeDescriptor, false> | TSSchemaUnknownTypeDescriptor<false>
          >,
        ).toBe(true);
      });

      it('Returns the same descriptor for the same facets', () => {
        const facets = parseJSONSchema({ type: 'string' });
        expect(getTSSchemaTypeDescriptor(facets)).toBe(getTSSchemaTypeDescriptor(facets));
      });
    });

    describe('TSSchemaTypeDescriptorOf', () => {
      // Type-level only cases, with no runtime counterpart: the unspecified fragment, and a definition of a known collection.
      it('Infers any descriptor for the unspecified fragment', () => {
        expect(true satisfies AssertTypeEquality<TSSchemaTypeDescriptorOf<JSONSchemaCollection, JSONSchemaNotCollectionFragment>, TSSchemaTypeDescriptor>).toBe(
          true,
        );
      });

      it('Infers the descriptor of a definition', () => {
        expect(
          true satisfies AssertTypeEquality<TSSchemaTypeDescriptorOf<_Schema, _Schema['$defs']['Person']>['properties']['mentor']['type']['name'], 'Person'>,
        ).toBe(true);
      });
    });
  });
});
