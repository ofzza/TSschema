import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection } from '../schema/JSONSchema/index.js';
import { JSONSchemaAnyOfTypeFragmentFacet, JSONSchemaCollectionFragmentFacet, JSONSchemaModelFragmentFacet } from './JSONSchema/index.js';
import { TSSchemaDefinitionReflection, TSSchemaFragmentReflection, TSSchemaPropertyReflection, reflect } from './TSSchemaReflection.js';
import type { TSSchemaPrimitiveTypeDescriptor, TSSchemaUnknownTypeDescriptor } from './TypeDescriptor.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

/**
 * Schema collection with a model at its root, and models reached through references, combinators, arrays and objects of unknown shape
 */
const _schema = {
  type: 'object',
  properties: { pet: { $ref: '#/$defs/Pet' } },
  required: ['pet'],
  $defs: {
    Cat: { type: 'object', properties: { name: { type: 'string' }, lives: { type: 'integer' } }, required: ['name', 'lives'] },
    Dog: { type: 'object', properties: { name: { type: 'string' }, good: { type: 'boolean' } }, required: ['name'] },
    Pet: { anyOf: [{ $ref: '#/$defs/Cat' }, { $ref: '#/$defs/Dog' }] },
    Owner: {
      type: ['object', 'null'],
      properties: {
        pets: { type: 'array', items: { $ref: '#/$defs/Pet' } },
        'home.city': { type: 'string' },
        home: { type: 'object', properties: { city: { type: 'number' } } },
        notes: { type: 'object' },
      },
      required: ['pets'],
    },
  },
} as const;
type _Schema = typeof _schema;

/**
 * Constraints of a number with none
 */
type _NoNumberConstraints = {
  readonly minimum: undefined;
  readonly maximum: undefined;
  readonly exclusiveMinimum: undefined;
  readonly exclusiveMaximum: undefined;
  readonly multipleOf: undefined;
};

describe('Reflection', () => {
  // `reflect` and the reflection classes (TSSchemaReflection.ts). Every case reflects either the `_schema` collection above (a model root, with models reached
  // through references, an `anyOf`, array items and a nullable model, plus a property named with a dot and an object of unknown shape) or the
  // res/sidecar/schema.json fixture (a large recursive collection, typed by its sidecar), pairing each runtime `expect` with an `AssertTypeEquality` on the
  // static type of the reflection's `Type`, `name` or other members.
  describe('reflect', () => {
    // What `reflect` returns for a collection, for a schema with no `$defs`, and for a JSON file: always the reflection of the root fragment.
    it('Reflects a collection as its root fragment, with the collection as its collection', () => {
      const root = reflect(_schema);
      expect(root).toBeInstanceOf(TSSchemaFragmentReflection);
      expect(root.name).toBe(undefined);
      expect(root.collection).toBeInstanceOf(JSONSchemaCollectionFragmentFacet);
      expect(root.facets.map((facet) => facet.constructor)).toEqual([JSONSchemaModelFragmentFacet]);
      expect(true satisfies AssertTypeEquality<typeof root.Type, { pet: { name: string; lives: number } | { name: string; good?: boolean } }>).toBe(true);
    });

    it('Reflects a schema with no $defs as is, with no collection', () => {
      const schema = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } as const;
      const root = reflect(schema);
      expect(root.collection).toBe(undefined);
      expect(root.definitionNames).toEqual([]);
      expect(root.propertyNames).toEqual(['id']);
      expect(true satisfies AssertTypeEquality<typeof root.Type, { id: string }>).toBe(true);
    });

    it('Reflects a JSON file typed by its sidecar', () => {
      // The fixture's root holds only annotations (`$schema`, `title`, ...) next to its `$defs`, so it parses into no facets.
      const root = reflect(jsonSchema);
      expect(root.facets).toEqual([]);
      expect(root.definitionNames).toContain('School');
    });
  });

  describe('TSSchemaFragmentReflection', () => {
    // The lookups of the base class, shared by every reflection, one nested describe per group of members.
    describe('Definitions', () => {
      // getDefinition and definitionNames, which every reflection of a schema answers from the same collection facet.
      it('Reflects a definition by name, from the root', () => {
        // A definition reflection holds the collection facet's own facets of the definition, by identity, rather than parsing it again.
        const root = reflect(_schema);
        expect(root.definitionNames).toEqual(['Cat', 'Dog', 'Pet', 'Owner']);
        expect(true satisfies AssertTypeEquality<(typeof root.definitionNames)[number], 'Cat' | 'Dog' | 'Pet' | 'Owner'>).toBe(true);
        const cat = root.getDefinition('Cat');
        expect(cat).toBeInstanceOf(TSSchemaDefinitionReflection);
        expect(cat.name).toBe('Cat');
        expect(cat.facets).toBe(root.collection?.$defs.Cat);
        expect(true satisfies AssertTypeEquality<typeof cat.Type, { name: string; lives: number }>).toBe(true);
      });

      it('Reflects a definition by name, from any reflection of the same schema', () => {
        const pet = reflect(_schema).getProperty('pet');
        const dog = pet.getDefinition('Dog');
        expect(dog.name).toBe('Dog');
        expect(true satisfies AssertTypeEquality<typeof dog.name, 'Dog'>).toBe(true);
      });

      it('Reflects no definition by an unknown name', () => {
        // Typed as the unspecified collection, where a definition may not exist, so `getDefinition` is typed as possibly returning `undefined`.
        const root = reflect({ $defs: {} } as JSONSchemaCollection);
        expect(root.getDefinition('Missing')).toBe(undefined);
        expect(true satisfies AssertTypeEquality<undefined extends ReturnType<typeof root.getDefinition> ? true : false, true>).toBe(true);
      });
    });

    describe('Properties', () => {
      // getProperty and propertyNames, which resolve like the type layer's TSSchemaProperty, with deliberate differences (see AGENTS.md › getProperty resolves
      // like TSSchemaProperty, with deliberate differences).
      it('Reflects a property by its name', () => {
        // A property found in a single model keeps that model's facets, by identity.
        const cat = reflect(_schema).getDefinition('Cat');
        expect(cat.propertyNames).toEqual(['name', 'lives']);
        const lives = cat.getProperty('lives');
        expect(lives).toBeInstanceOf(TSSchemaPropertyReflection);
        expect(lives.name).toBe('lives');
        expect(lives.parent).toBe(cat);
        expect(lives.required).toBe(true);
        expect(lives.facets).toBe(cat.facets[0].properties.lives);
        expect(true satisfies AssertTypeEquality<typeof lives.Type, number>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof lives.parent, typeof cat>).toBe(true);
      });

      it('Reflects a property through a reference, and of a nullable model', () => {
        // `Owner` is `type: ['object', 'null']`, so its model is reached through the implicit `anyOf` of its branches.
        const root = reflect(_schema);
        expect(root.getProperty('pet').propertyNames).toEqual(['name', 'lives', 'good']);
        const owner = root.getDefinition('Owner');
        expect(owner.propertyNames).toEqual(['pets', 'home.city', 'home', 'notes']);
        expect(owner.getProperty('pets').required).toBe(true);
      });

      it('Reflects a property found in several models as one, holding an implicit anyOf of each', () => {
        // Its static type is checked by the inferred `Type` alone, as the implicit `anyOf` member union holds structurally identical members (see AGENTS.md › A
        // property found in several models is one reflection holding a fresh implicit anyOf facet).
        const pet = reflect(_schema).getDefinition('Pet');
        const name = pet.getProperty('name');
        expect(name.facets.length).toBe(1);
        expect(name.facets[0]).toBeInstanceOf(JSONSchemaAnyOfTypeFragmentFacet);
        expect((name.facets[0] as JSONSchemaAnyOfTypeFragmentFacet<_Schema>).implicit).toBe(true);
        expect(name.required).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof name.Type, string>).toBe(true);
      });

      it('Requires a property found in several models only if every model requires it', () => {
        const pet = reflect(_schema).getDefinition('Pet');
        expect(pet.getProperty('lives').required).toBe(true);
        expect(pet.getProperty('good').required).toBe(false);
      });

      it('Reflects a property by a dot-separated path, through array items, with the path prefix as its parent', () => {
        // `getProperty('pets.good')` equals `getProperty('pets').getProperty('good')`, which is what makes `parent` the reflection of the path prefix.
        const owner = reflect(_schema).getDefinition('Owner');
        const good = owner.getProperty('pets.good');
        expect(good.name).toBe('good');
        expect(good.parent.name).toBe('pets');
        expect(good.parent.parent).toBe(owner);
        expect(true satisfies AssertTypeEquality<typeof good.Type, boolean>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof good.parent.name, 'pets'>).toBe(true);
      });

      it('Reflects a property by an exact name containing a dot, rather than by a path', () => {
        // `Owner` defines both `home.city` (a string) and `home`, with a numeric `city`: the exact name wins, as in the type layer (see AGENTS.md › An exact
        // property name wins over a dotted path).
        const owner = reflect(_schema).getDefinition('Owner');
        const city = owner.getProperty('home.city');
        expect(city.parent).toBe(owner);
        expect(true satisfies AssertTypeEquality<typeof city.Type, string>).toBe(true);
        expect(owner.getProperty('home').getProperty('city').name).toBe('city');
      });

      it('Reflects any property of an object of unknown shape, of unknown type and shape', () => {
        // `notes` is an object with no `properties`. An unknown shape consumes one path segment at a time, so every segment is a reflection of its own, never
        // required, and `name` is the last key.
        const owner = reflect(_schema).getDefinition('Owner');
        const deep = owner.getProperty('notes.a.b');
        expect(deep.name).toBe('b');
        expect(deep.parent.name).toBe('a');
        expect(deep.facets).toEqual([]);
        expect(deep.required).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof deep.Type, unknown>).toBe(true);
      });

      it('Reflects no property by a name or path which addresses none', () => {
        // `name` is a string, so the rest of the path addresses nothing. Only a path's first segment is checked at compile time, so the rest infers `undefined`
        // rather than erroring (see AGENTS.md › Paths are resolved, never enumerated).
        const cat = reflect(_schema).getDefinition('Cat');
        expect(cat.getProperty('name.length' as 'name')).toBe(undefined);
        expect(true satisfies AssertTypeEquality<ReturnType<typeof cat.getProperty<'name.length'>>, undefined>).toBe(true);
        // @ts-expect-error `nope` is not a property of `Cat`
        expect(cat.getProperty('nope')).toBe(undefined);
      });

      it('Reflects properties of a recursive schema at any depth', () => {
        // `Person` and `Class` refer to each other (`classes` holds `Class` items, `professor` is a nullable `Person`), so the path loops through both twice;
        // `professor` is required in `Class` though nullable, while `email` is optional in `Person` and nullable.
        const person = reflect(jsonSchema).getDefinition('Person');
        const email = person.getProperty('classes.professor.classes.professor.email');
        expect(email.name).toBe('email');
        expect(email.required).toBe(false);
        expect(email.parent.required).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof email.Type, string | null>).toBe(true);
      });
    });

    describe('Type descriptors', () => {
      // The `typeDescriptor` getter of a reflection: only how descriptors relate to the reflections and are shared between them, and how a property's being
      // required (on the reflection) is kept apart from its being nullable (on the descriptor), as building them is covered by TypeDescriptor.test.ts.
      it('Describes the type of the root, a definition and a property', () => {
        // Descriptors are cached per facets array, and `lives` keeps its model's facets, so its descriptor is the very `type` of `Cat`'s property entry.
        const root = reflect(_schema);
        expect(root.typeDescriptor.kind).toBe('model');
        expect(true satisfies AssertTypeEquality<typeof root.typeDescriptor.properties.pet.type.name, 'Pet'>).toBe(true);
        const cat = root.getDefinition('Cat');
        expect(cat.typeDescriptor).toEqual({
          kind: 'model',
          properties: {
            name: { required: true, type: { kind: 'primitive', type: 'string', constraints: {}, nullable: false }, annotations: { decorators: [] } },
            lives: { required: true, type: { kind: 'primitive', type: 'integer', constraints: {}, nullable: false }, annotations: { decorators: [] } },
          },
          required: ['name', 'lives'],
          constraints: {},
          nullable: false,
        });
        const lives = cat.getProperty('lives');
        expect(lives.typeDescriptor).toBe(cat.typeDescriptor.properties.lives.type);
        expect(true satisfies AssertTypeEquality<typeof lives.typeDescriptor, TSSchemaPrimitiveTypeDescriptor<'integer', false, _NoNumberConstraints>>).toBe(
          true,
        );
      });

      it('Describes a definition by the same descriptor as every reference to it', () => {
        // A reference's lazy `target` is the definition reflection's descriptor itself, thanks to the cache within one parsed schema (see AGENTS.md › A
        // reference descriptor's target is a lazy getter).
        const root = reflect(_schema);
        const pet = root.getProperty('pet').typeDescriptor;
        expect(pet.target).toBe(root.getDefinition('Pet').typeDescriptor);
        expect(root.getDefinition('Cat').typeDescriptor).toBe(root.getDefinition('Cat').typeDescriptor);
      });

      it('Describes a nullable model as a model, flagged nullable', () => {
        // Being required belongs to a property entry of the model descriptor, never to the property's type descriptor (see AGENTS.md › A model descriptor's
        // properties hold { required, type, annotations } entries).
        const owner = reflect(_schema).getDefinition('Owner').typeDescriptor;
        expect([owner.kind, owner.nullable]).toEqual(['model', true]);
        expect(owner.properties.pets.required).toBe(true);
        expect(owner.properties.notes.required).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof owner.nullable, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof owner.properties.notes.required, false>).toBe(true);
      });

      it('Tells being required and being nullable apart, for properties of every kind', () => {
        // The fixture has every combination of the two, for references (to models and to enums), arrays (with nullable items, too), records and primitives.
        // `required` is the property reflection's, `nullable` its type descriptor's.
        const schema = reflect(jsonSchema);
        const professor = schema.getDefinition('Class').getProperty('professor');
        expect([professor.required, professor.typeDescriptor.kind, professor.typeDescriptor.nullable]).toEqual([true, 'reference', true]);
        expect(true satisfies AssertTypeEquality<typeof professor.typeDescriptor.nullable, true>).toBe(true);
        const term = schema.getDefinition('Class').getProperty('term');
        expect([term.required, term.typeDescriptor.kind, term.typeDescriptor.nullable]).toEqual([false, 'reference', true]);
        expect(true satisfies AssertTypeEquality<typeof term.typeDescriptor.nullable, true>).toBe(true);
        const schedule = schema.getDefinition('Class').getProperty('schedule');
        expect([schedule.required, schedule.typeDescriptor.kind, schedule.typeDescriptor.nullable]).toEqual([false, 'array', true]);
        expect(true satisfies AssertTypeEquality<typeof schedule.typeDescriptor.nullable, true>).toBe(true);

        const rawScores = schema.getDefinition('NullableScalarSeries').getProperty('rawScores');
        expect([rawScores.required, rawScores.typeDescriptor.nullable, rawScores.typeDescriptor.items.nullable]).toEqual([true, true, true]);
        expect(true satisfies AssertTypeEquality<typeof rawScores.typeDescriptor.items.nullable, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof rawScores.Type, Array<number | null> | null>).toBe(true);
        const attemptedFlags = schema.getDefinition('NullableScalarSeries').getProperty('attemptedFlags');
        expect([attemptedFlags.required, attemptedFlags.typeDescriptor.nullable, attemptedFlags.typeDescriptor.items.nullable]).toEqual([true, false, true]);
        expect(true satisfies AssertTypeEquality<typeof attemptedFlags.typeDescriptor.nullable, false>).toBe(true);

        const seatByItem = schema.getDefinition('NullableScalarRegister').getProperty('seatByItem');
        expect([seatByItem.required, seatByItem.typeDescriptor.kind, seatByItem.typeDescriptor.nullable]).toEqual([false, 'record', true]);
        expect(true satisfies AssertTypeEquality<typeof seatByItem.typeDescriptor.nullable, true>).toBe(true);

        const curveAdjustment = schema.getDefinition('NullableScalarBattery').getProperty('curveAdjustment');
        expect([curveAdjustment.required, curveAdjustment.typeDescriptor.kind, curveAdjustment.typeDescriptor.nullable]).toEqual([false, 'primitive', true]);
        expect(true satisfies AssertTypeEquality<typeof curveAdjustment.Type, number | null>).toBe(true);
        const isOpenBook = schema.getDefinition('Assessment').getProperty('isOpenBook');
        expect([isOpenBook.required, isOpenBook.typeDescriptor.kind, isOpenBook.typeDescriptor.nullable]).toEqual([false, 'primitive', false]);
        expect(true satisfies AssertTypeEquality<typeof isOpenBook.Type, boolean>).toBe(true);
      });

      it('Describes a property of unknown shape as unknown', () => {
        const deep = reflect(_schema).getDefinition('Owner').getProperty('notes.a');
        expect(deep.typeDescriptor).toEqual({ kind: 'unknown', nullable: false });
        expect(true satisfies AssertTypeEquality<typeof deep.typeDescriptor, TSSchemaUnknownTypeDescriptor<false>>).toBe(true);
      });
    });

    describe('Annotations', () => {
      // The `annotations` getter of a reflection and its shortcuts (`title`, `description`, `default`, `deprecated`, `examples`, `decorators`): only which
      // fragment each reflection reads them from, as reading them is covered by Annotations.test.ts. Uses the res/sidecar/schema.json fixture, whose
      // annotations and `x-decorators` the sibling dotnetschema generates from .NET attributes, and the inline `_annotated` collection below for the
      // positions the fixture does not cover, each runtime `expect` paired with an `AssertTypeEquality` on the literal type inferred from the schema.

      /**
       * Collection annotating its root, a definition, and properties next to a `$ref`, next to a nullable reference's `anyOf`, with no type keywords, and
       * in two models at once
       */
      const _annotated = {
        title: 'Root',
        $defs: {
          Tag: { type: 'string', description: 'A tag' },
          A: {
            type: 'object',
            properties: {
              tag: { $ref: '#/$defs/Tag', title: 'Main tag' },
              other: { anyOf: [{ $ref: '#/$defs/Tag' }, { type: 'null' }], deprecated: true },
              any: { examples: [1, 'a'] },
              shared: { type: 'string', title: 'Shared in A' },
            },
          },
          B: { type: 'object', properties: { shared: { type: 'string', title: 'Shared in B' } } },
          AB: { anyOf: [{ $ref: '#/$defs/A' }, { $ref: '#/$defs/B' }] },
        },
      } as const;

      it('Reads the annotations of the root, a definition and a property from their own fragments', () => {
        const root = reflect(jsonSchema);
        expect(root.title).toBe('school');
        expect(true satisfies AssertTypeEquality<typeof root.title, 'school'>).toBe(true);

        const campus = root.getDefinition('Campus');
        expect(campus.title).toBe('Campus site');
        expect(campus.decorators).toEqual([{ name: 'System.ComponentModel.DisplayNameAttribute', arguments: { displayName: 'Campus site' }, properties: {} }]);
        expect(true satisfies AssertTypeEquality<typeof campus.title, 'Campus site'>).toBe(true);
        expect(true satisfies AssertTypeEquality<(typeof campus.decorators)[0]['arguments']['displayName'], 'Campus site'>).toBe(true);

        // `isbn` is a nullable string, a type array split into branches: its annotations are still read from the property's fragment as a whole
        const isbn = root.getDefinition('Book').getProperty('isbn');
        expect([isbn.title, isbn.description]).toEqual(['ISBN-13', 'ISBN-13, formatted with separators.']);
        expect(isbn.decorators[0].properties).toEqual({ Description: 'ISBN-13, formatted with separators.', Name: 'ISBN-13' });
        expect(true satisfies AssertTypeEquality<typeof isbn.title, 'ISBN-13'>).toBe(true);

        const hasDigitalLicence = root.getDefinition('Book').getProperty('hasDigitalLicence');
        expect(hasDigitalLicence.default).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof hasDigitalLicence.default, false>).toBe(true);
      });

      it('Reads the annotations next to a reference, never through it', () => {
        // Annotations belong to the position a type is used at: `tag` has its own title, not `Tag`'s description, and `other` is flagged deprecated next
        // to the `anyOf` of its nullable reference (see AGENTS.md › Annotations belong to the position a fragment is used at).
        const a = reflect(_annotated).getDefinition('A');
        const tag = a.getProperty('tag');
        expect([tag.title, tag.description]).toEqual(['Main tag', undefined]);
        expect(true satisfies AssertTypeEquality<typeof tag.title, 'Main tag'>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof tag.description, undefined>).toBe(true);
        expect(a.getDefinition('Tag').description).toBe('A tag');

        const other = a.getProperty('other');
        expect(other.deprecated).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof other.deprecated, true>).toBe(true);
      });

      it('Reads the annotations of a fragment with no type keywords', () => {
        // `any` parses into no facets, so its annotations could not be read from facets; reflections keep their fragment for this
        const any = reflect(_annotated).getDefinition('A').getProperty('any');
        expect(any.facets).toEqual([]);
        expect(any.examples).toEqual([1, 'a']);
        expect(true satisfies AssertTypeEquality<typeof any.examples, readonly [1, 'a']>).toBe(true);
      });

      it('Reads no annotations for a property found in several models', () => {
        // Its fragment is the implicit `anyOf` of each found property, which has none of its own: each model's annotations stay on that model's property
        // (see AGENTS.md › A property found in several models is one reflection holding a fresh implicit anyOf facet)
        const ab = reflect(_annotated).getDefinition('AB');
        const shared = ab.getProperty('shared');
        expect(shared.annotations).toEqual({ decorators: [] });
        expect(shared.title).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof shared.title, undefined>).toBe(true);
        expect(ab.getDefinition('A').getProperty('shared').title).toBe('Shared in A');
      });
    });
  });
});
