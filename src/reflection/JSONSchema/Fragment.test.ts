import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaFragmentType, JSONSchemaFragmentTypeBranch } from '../../schema/JSONSchema/index.js';
import { JSONSchemaCollectionFragmentNode, JSONSchemaFragmentNode, JSONSchemaModelFragmentNode, getJSONSchemaFragmentTypeBranches } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = {
  $defs: {
    Person: { type: 'object', properties: { name: { type: 'string' }, mentor: { $ref: '#/$defs/Person' } }, required: ['name'] },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Any fragment', () => {
      it('Parses any fragment with a common base class', () => {
        const person = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0];
        expect(person).toBeInstanceOf(JSONSchemaFragmentNode);
      });

      it('Gets the name of a fragment of the collection', () => {
        const person = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0];
        expect(person.name).toBe('Person');
        expect(true satisfies AssertTypeEquality<typeof person.name, 'Person'>).toBe(true);
      });

      it('Gets no name for a nested fragment', () => {
        const name = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0].properties.name[0];
        expect(name.name).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof name.name, undefined>).toBe(true);
      });

      it('Gets the parsed JSON fragment', () => {
        const person = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0];
        expect(person.fragment).toBe(_schema.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person.fragment, _Schema['$defs']['Person']>).toBe(true);
      });

      it('Infers the type of the parsed fragment, but holds no value for it', () => {
        const person = new JSONSchemaCollectionFragmentNode(_schema).$defs.Person[0];
        type Person = typeof person.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Person, JSONSchemaFragmentType<_Schema['$defs']['Person'], _Schema>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Person, 'mentor'>, { mentor?: Person }>).toBe(true);
        expect(() => person.Type).toThrow();
      });

      it('Takes the context and name of a fragment as named options', () => {
        const collection = new JSONSchemaCollectionFragmentNode(_schema);
        const person = new JSONSchemaModelFragmentNode(_schema.$defs.Person, { context: collection, name: 'Person' });
        expect(person.name).toBe('Person');
        expect(person.properties.mentor[0].ref).toBe(collection.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person, JSONSchemaModelFragmentNode<_Schema, 'Person', _Schema['$defs']['Person']>>).toBe(true);
        // @ts-expect-error A name must name a fragment of the context collection
        expect(new JSONSchemaModelFragmentNode(_schema.$defs.Person, { context: collection, name: 'Nobody' }).name).toBe('Nobody');
      });

      it('Parses a fragment with no context and no name when both are omitted', () => {
        const person = new JSONSchemaModelFragmentNode(_schema.$defs.Person);
        expect(person.name).toBe(undefined);
        expect(person.properties.mentor[0].ref).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof person.name, JSONSchemaFragmentName<JSONSchemaCollection> | undefined>).toBe(true);
      });

      it('Can be extended by a node of its own', () => {
        class Custom extends JSONSchemaFragmentNode<_Schema, undefined, { readonly title: 'Custom' }> {}
        const custom = new Custom({ title: 'Custom' }, { context: new JSONSchemaCollectionFragmentNode(_schema) });
        expect(custom.fragment.title).toBe('Custom');
        expect(custom).not.toBeInstanceOf(JSONSchemaModelFragmentNode);
      });
    });

    describe('Type array branches', () => {
      it('Splits a type array naming non primitive types into a branch per group of type names', () => {
        const fragment = { type: ['object', 'array', 'string', 'boolean', 'null'], title: 'x' } as const;
        const branches = getJSONSchemaFragmentTypeBranches(fragment);
        expect(branches).toEqual([
          { type: 'object', title: 'x' },
          { type: 'array', title: 'x' },
          { type: 'null', title: 'x' },
          { type: ['string', 'boolean'], title: 'x' },
        ]);
        expect(true satisfies AssertTypeEquality<typeof branches, Array<JSONSchemaFragmentTypeBranch<typeof fragment>>>).toBe(true);
      });

      it('Splits a type array naming null off its primitive types, e.g. a nullable primitive', () => {
        expect(getJSONSchemaFragmentTypeBranches({ type: ['string', 'null'] } as const)).toEqual([{ type: 'null' }, { type: ['string'] }]);
        expect(getJSONSchemaFragmentTypeBranches({ type: ['null'] } as const)).toEqual([{ type: 'null' }]);
      });

      it('Keeps every other keyword in each branch', () => {
        const fragment = { type: ['object', 'string'], enum: ['a', 1] } as const;
        expect(getJSONSchemaFragmentTypeBranches(fragment).every((branch) => branch.enum === fragment.enum)).toBe(true);
      });

      it('Leaves a fragment with no type array naming non primitive types as is', () => {
        const primitives = { type: ['string', 'boolean'] } as const;
        expect(getJSONSchemaFragmentTypeBranches(primitives)).toEqual([primitives]);
        expect(getJSONSchemaFragmentTypeBranches(primitives)[0]).toBe(primitives);
        expect(true satisfies AssertTypeEquality<ReturnType<typeof getJSONSchemaFragmentTypeBranches<typeof primitives>>, Array<typeof primitives>>).toBe(true);
        const model = _schema.$defs.Person;
        expect(getJSONSchemaFragmentTypeBranches(model)[0]).toBe(model);
        const constant = { const: 1 } as const;
        expect(getJSONSchemaFragmentTypeBranches(constant)[0]).toBe(constant);
      });
    });
  });
});
