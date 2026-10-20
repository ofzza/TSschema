import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaDefinitionName, JSONSchemaFragmentType, JSONSchemaFragmentTypeBranch } from '../../schema/JSONSchema/index.js';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaFragmentFacet, JSONSchemaModelFragmentFacet, getJSONSchemaFragmentTypeBranches } from './index.js';

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
  // Runtime tests of Fragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in src/schema/JSONSchema/Fragment.test-d.ts, so the
  // two layers' tests line up; the router, which the type layer's dispatcher maps to, is tested in FragmentFacets.test.ts.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe; this one holds their base class, and type array branches.
    describe('Any fragment', () => {
      // The abstract JSONSchemaFragmentFacet base class every facet class extends: its `name`, `fragment` and `collection`, the type-only `Type`, and its `{
      // collection, name }` options. Tested on the facets of the small recursive collection above, taken from a JSONSchemaCollectionFragmentFacet or
      // constructed directly, and on a facet class of the test's own. Each runtime `expect` is paired with an AssertTypeEquality on its static type.
      it('Parses any fragment with a common base class', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person).toBeInstanceOf(JSONSchemaFragmentFacet);
      });

      it('Gets the name of a fragment of the collection', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person.name).toBe('Person');
        expect(true satisfies AssertTypeEquality<typeof person.name, 'Person'>).toBe(true);
      });

      it('Gets no name for a nested fragment', () => {
        const name = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0].properties.name[0];
        expect(name.name).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof name.name, undefined>).toBe(true);
      });

      it('Gets the parsed JSON fragment', () => {
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        expect(person.fragment).toBe(_schema.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person.fragment, _Schema['$defs']['Person']>).toBe(true);
      });

      it('Infers the type of the parsed fragment, but holds no value for it', () => {
        // `Type` is only meant for `typeof`: the getter throws when read. The recursive `mentor` is compared through `Pick`, which keeps it optional.
        const person = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Person[0];
        type Person = typeof person.Type;
        //   ^?
        expect(true satisfies AssertTypeEquality<Person, JSONSchemaFragmentType<_Schema['$defs']['Person'], _Schema>>).toBe(true);
        expect(true satisfies AssertTypeEquality<Pick<Person, 'mentor'>, { mentor?: Person }>).toBe(true);
        expect(() => person.Type).toThrow();
      });

      it('Takes the collection and name of a fragment as named options', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const person = new JSONSchemaModelFragmentFacet(_schema.$defs.Person, { collection: collection, name: 'Person' });
        expect(person.name).toBe('Person');
        expect(person.properties.mentor[0].ref).toBe(collection.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person, JSONSchemaModelFragmentFacet<_Schema, 'Person', _Schema['$defs']['Person']>>).toBe(true);
        // @ts-expect-error A name must name a fragment of the collection collection
        expect(new JSONSchemaModelFragmentFacet(_schema.$defs.Person, { collection: collection, name: 'Nobody' }).name).toBe('Nobody');
      });

      it('Parses a fragment with no collection and no name when both are omitted', () => {
        // With no collection to infer it from, the name is typed as any definition name of the unspecified collection, or `undefined`.
        // See AGENTS.md › The collection facet is also what every `$ref` resolves against.
        const person = new JSONSchemaModelFragmentFacet(_schema.$defs.Person);
        expect(person.name).toBe(undefined);
        expect(person.properties.mentor[0].ref).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof person.name, JSONSchemaDefinitionName<JSONSchemaCollection> | undefined>).toBe(true);
      });

      it('Can be extended by a facet of its own', () => {
        class Custom extends JSONSchemaFragmentFacet<_Schema, undefined, { readonly title: 'Custom' }> {}
        const custom = new Custom({ title: 'Custom' }, { collection: new JSONSchemaCollectionFragmentFacet(_schema) });
        expect(custom.fragment.title).toBe('Custom');
        expect(custom).not.toBeInstanceOf(JSONSchemaModelFragmentFacet);
      });
    });

    describe('Type array branches', () => {
      // getJSONSchemaFragmentTypeBranches, the runtime mirror of JSONSchemaFragmentTypeBranch, tested side by side with it on inline `as const` fragments: the
      // branches by `toEqual`, and their static type by AssertTypeEquality against the type layer's.
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
        // A fragment which is not split is returned itself, not a copy, hence `toBe`.
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
