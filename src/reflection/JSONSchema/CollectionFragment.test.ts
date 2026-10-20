import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaEnumFragmentFacet,
  JSONSchemaFragmentFacet,
  JSONSchemaModelFragmentFacet,
  type JSONSchemaCollectionParsedFragment,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentFacetOf,
} from './index.js';

import { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?

/**
 * Small collection, used in the tests below
 */
const _schema = {
  title: 'People',
  type: 'object',
  properties: { people: { type: 'array', items: { $ref: '#/$defs/Person' } } },
  $defs: {
    Person: { type: 'object', properties: { name: { type: 'string' }, role: { $ref: '#/$defs/Role' } } },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  // Runtime tests of CollectionFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/CollectionFragment.test-d.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('Collection fragment', () => {
      // JSONSchemaCollectionFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsCollection), the definition `names`, the `$defs` record of each
      // definition's facets, and its own role as a facet of the whole schema. Tested on the small inline collection above (a root model next to `$defs`
      // referencing each other) and on the res/schema.json fixture, constructing the collection facet directly. Each runtime `expect` on a parsed value is
      // paired with an AssertTypeEquality on its static type.
      it('Detects a collection', () => {
        expect(JSONSchemaCollectionFragmentFacet.is(_schema)).toBe(true);
        expect(JSONSchemaCollectionFragmentFacet.is(jsonSchema)).toBe(true);
        expect(JSONSchemaCollectionFragmentFacet.is({ $defs: {} })).toBe(true);
      });

      it('Rejects a non-collection', () => {
        expect(JSONSchemaCollectionFragmentFacet.is({ type: 'object' })).toBe(false);
        expect(JSONSchemaCollectionFragmentFacet.is({ $defs: [] } as any)).toBe(false);
        expect(JSONSchemaCollectionFragmentFacet.is({ $defs: true } as any)).toBe(false);
      });

      it('Gets the names of all definitions of the collection', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(collection.names).toEqual(['Person', 'Role']);
        expect(true satisfies AssertTypeEquality<typeof collection.names, Array<'Person' | 'Role'>>).toBe(true);
        expect(new JSONSchemaCollectionFragmentFacet(jsonSchema).names).toEqual(Object.keys(jsonSchema.$defs));
      });

      it('Parses each fragment of the collection, addressed by name', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const person = collection.$defs.Person;
        expect(person.length).toBe(1);
        expect(person[0]).toBeInstanceOf(JSONSchemaModelFragmentFacet);
        expect(person[0].name).toBe('Person');
        expect(person[0].fragment).toBe(_schema.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person, Array<JSONSchemaModelFragmentFacet<_Schema, 'Person', _Schema['$defs']['Person']>>>).toBe(true);
        const role = collection.$defs.Role;
        expect(role[0]).toBeInstanceOf(JSONSchemaEnumFragmentFacet);
        expect(true satisfies AssertTypeEquality<typeof role, Array<JSONSchemaEnumFragmentFacet<_Schema, 'Role', _Schema['$defs']['Role']>>>).toBe(true);
      });

      it('Parses the fragments of the fixture collection', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(jsonSchema);
        const assessment = collection.$defs.Assessment[0];
        expect(assessment).toBeInstanceOf(JSONSchemaModelFragmentFacet);
        expect(assessment.names).toContain('weight');
        type Assessment = typeof assessment.Type;
        //   ^?
        expect(
          true satisfies AssertTypeEquality<
            Assessment,
            JSONSchemaFragmentType<JSONSchemaFixtureCollection['$defs']['Assessment'], JSONSchemaFixtureCollection>
          >,
        ).toBe(true);
      });

      it('Parses the collection as a fragment facet of the whole schema', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(collection).toBeInstanceOf(JSONSchemaFragmentFacet);
        expect(collection.name).toBe(undefined);
        expect(collection.fragment).toBe(_schema);
        expect(true satisfies AssertTypeEquality<typeof collection.name, undefined>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof collection.fragment, _Schema>).toBe(true);
      });

      it('Infers the value type of the collection from its root fragment, leaving out its $defs', () => {
        // The root fragment is the collection with its `$defs` left out (JSONSchemaCollectionRootFragment).
        // See AGENTS.md › The collection facet is also what every `$ref` resolves against.
        const _collection = new JSONSchemaCollectionFragmentFacet(_schema);
        expect(true satisfies AssertTypeEquality<typeof _collection.Type, JSONSchemaFragmentType<JSONSchemaCollectionRootFragment<_Schema>, _Schema>>).toBe(
          true,
        );
        expect(true satisfies AssertTypeEquality<keyof JSONSchemaCollectionRootFragment<_Schema>, 'title' | 'type' | 'properties'>).toBe(true);
      });

      it('Parses no fragments for a collection with empty $defs', () => {
        const collection = new JSONSchemaCollectionFragmentFacet({ $defs: {} });
        expect(collection.names).toEqual([]);
        expect(collection.$defs).toEqual({});
      });

      it('Parses any fragment of an unspecified collection', () => {
        // With the unspecified JSONSchemaCollection, nothing is known of a definition, so its facets are typed as every facet type the router can create.
        const collection = new JSONSchemaCollectionFragmentFacet({ $defs: { A: { type: 'string' } } } as JSONSchemaCollection);
        expect(collection.$defs.A.length).toBe(1);
        expect(
          true satisfies AssertTypeEquality<
            (typeof collection.$defs)[string],
            Array<JSONSchemaFragmentFacetOf<JSONSchemaCollection, string, JSONSchemaNotCollectionFragment>>
          >,
        ).toBe(true);
      });
    });

    describe('Collection parsed fragment', () => {
      // JSONSchemaCollectionParsedFragment, the fragment of a definition as it is parsed. Tested at type level only.
      it('Gets a fragment of a collection, as parsed', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaCollectionParsedFragment<_Schema, 'Role'>, _Schema['$defs']['Role']>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaCollectionParsedFragment<JSONSchemaCollection, string>, JSONSchemaNotCollectionFragment>).toBe(true);
      });
    });
  });
});
