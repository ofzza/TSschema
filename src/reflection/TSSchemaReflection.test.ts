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

describe('Reflection', () => {
  describe('reflect', () => {
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
      const root = reflect(jsonSchema);
      expect(root.facets).toEqual([]);
      expect(root.definitionNames).toContain('School');
    });
  });

  describe('TSSchemaFragmentReflection', () => {
    describe('Definitions', () => {
      it('Reflects a definition by name, from the root', () => {
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
        const root = reflect({ $defs: {} } as JSONSchemaCollection);
        expect(root.getDefinition('Missing')).toBe(undefined);
        expect(true satisfies AssertTypeEquality<undefined extends ReturnType<typeof root.getDefinition> ? true : false, true>).toBe(true);
      });
    });

    describe('Properties', () => {
      it('Reflects a property by its name', () => {
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
        const root = reflect(_schema);
        expect(root.getProperty('pet').propertyNames).toEqual(['name', 'lives', 'good']);
        const owner = root.getDefinition('Owner');
        expect(owner.propertyNames).toEqual(['pets', 'home.city', 'home', 'notes']);
        expect(owner.getProperty('pets').required).toBe(true);
      });

      it('Reflects a property found in several models as one, holding an implicit anyOf of each', () => {
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
        const owner = reflect(_schema).getDefinition('Owner');
        const good = owner.getProperty('pets.good');
        expect(good.name).toBe('good');
        expect(good.parent.name).toBe('pets');
        expect(good.parent.parent).toBe(owner);
        expect(true satisfies AssertTypeEquality<typeof good.Type, boolean>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof good.parent.name, 'pets'>).toBe(true);
      });

      it('Reflects a property by an exact name containing a dot, rather than by a path', () => {
        const owner = reflect(_schema).getDefinition('Owner');
        const city = owner.getProperty('home.city');
        expect(city.parent).toBe(owner);
        expect(true satisfies AssertTypeEquality<typeof city.Type, string>).toBe(true);
        expect(owner.getProperty('home').getProperty('city').name).toBe('city');
      });

      it('Reflects any property of an object of unknown shape, of unknown type and shape', () => {
        const owner = reflect(_schema).getDefinition('Owner');
        const deep = owner.getProperty('notes.a.b');
        expect(deep.name).toBe('b');
        expect(deep.parent.name).toBe('a');
        expect(deep.facets).toEqual([]);
        expect(deep.required).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof deep.Type, unknown>).toBe(true);
      });

      it('Reflects no property by a name or path which addresses none', () => {
        const cat = reflect(_schema).getDefinition('Cat');
        expect(cat.getProperty('name.length' as 'name')).toBe(undefined);
        expect(true satisfies AssertTypeEquality<ReturnType<typeof cat.getProperty<'name.length'>>, undefined>).toBe(true);
        // @ts-expect-error `nope` is not a property of `Cat`
        expect(cat.getProperty('nope')).toBe(undefined);
      });

      it('Reflects properties of a recursive schema at any depth', () => {
        const person = reflect(jsonSchema).getDefinition('Person');
        const email = person.getProperty('classes.professor.classes.professor.email');
        expect(email.name).toBe('email');
        expect(email.required).toBe(true);
        expect(email.parent.required).toBe(false);
        expect(true satisfies AssertTypeEquality<typeof email.Type, string>).toBe(true);
      });
    });

    describe('Type descriptors', () => {
      it('Describes the type of the root, a definition and a property', () => {
        const root = reflect(_schema);
        expect(root.typeDescriptor.kind).toBe('model');
        expect(true satisfies AssertTypeEquality<typeof root.typeDescriptor.properties.pet.name, 'Pet'>).toBe(true);
        const cat = root.getDefinition('Cat');
        expect(cat.typeDescriptor).toEqual({
          kind: 'model',
          properties: { name: { kind: 'primitive', type: 'string' }, lives: { kind: 'primitive', type: 'integer' } },
          required: ['name', 'lives'],
        });
        const lives = cat.getProperty('lives');
        expect(lives.typeDescriptor).toEqual({ kind: 'primitive', type: 'integer' });
        expect(true satisfies AssertTypeEquality<typeof lives.typeDescriptor, TSSchemaPrimitiveTypeDescriptor<'integer'>>).toBe(true);
      });

      it('Describes a definition by the same descriptor as every reference to it', () => {
        const root = reflect(_schema);
        const pet = root.getProperty('pet').typeDescriptor;
        expect(pet.target).toBe(root.getDefinition('Pet').typeDescriptor);
        expect(root.getDefinition('Cat').typeDescriptor).toBe(root.getDefinition('Cat').typeDescriptor);
      });

      it('Describes a nullable model as an implicit anyOf', () => {
        const owner = reflect(_schema).getDefinition('Owner').typeDescriptor;
        expect(owner.kind).toBe('anyOf');
        expect(owner.implicit).toBe(true);
        expect(owner.members.map((member) => member.kind)).toEqual(['model', 'null']);
      });

      it('Describes a property of unknown shape as unknown', () => {
        const deep = reflect(_schema).getDefinition('Owner').getProperty('notes.a');
        expect(deep.typeDescriptor).toEqual({ kind: 'unknown' });
        expect(true satisfies AssertTypeEquality<typeof deep.typeDescriptor, TSSchemaUnknownTypeDescriptor>).toBe(true);
      });
    });
  });
});
