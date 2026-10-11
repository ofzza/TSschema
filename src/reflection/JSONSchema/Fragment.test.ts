import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaFragmentType, JSONSchemaFragmentTypeBranch } from '../../schema/JSONSchema/index.js';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaFragmentReflect, JSONSchemaModelFragmentReflect, getJSONSchemaFragmentTypeBranches } from './index.js';

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
  describe('JSONSchema fragment reflections', () => {
    describe('Any fragment', () => {
      it('Reflects any fragment with a common base class', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person).toBeInstanceOf(JSONSchemaFragmentReflect);
      });

      it('Gets the name of a fragment of the collection', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person.name).toBe('Person');
        expect(true satisfies AssertTypeEquality<typeof person.name, 'Person'>).toBe(true);
      });

      it('Gets no name for a nested fragment', () => {
        const name = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0].properties.name[0];
        expect(name.name).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof name.name, undefined>).toBe(true);
      });

      it('Gets the reflected JSON fragment', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        expect(person.fragment).toBe(_schema.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person.fragment, _Schema['$defs']['Person']>).toBe(true);
      });

      it('Infers the type of the reflected fragment, but holds no value for it', () => {
        const person = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Person')[0];
        type Person = typeof person.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Person, JSONSchemaFragmentType<_Schema['$defs']['Person'], _Schema>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Person, 'mentor'>, { mentor?: Person }>).toBe(true);
        expect(() => person.Type).toThrow();
      });

      it('Can be extended by a reflection of its own', () => {
        class Custom extends JSONSchemaFragmentReflect<_Schema, undefined, { readonly title: 'Custom' }> {}
        const custom = new Custom(new JSONSchemaCollectionFragmentReflect(_schema), undefined, { title: 'Custom' });
        expect(custom.fragment.title).toBe('Custom');
        expect(custom).not.toBeInstanceOf(JSONSchemaModelFragmentReflect);
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
