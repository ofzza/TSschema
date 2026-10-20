import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaDefinitionName, JSONSchemaReferenceFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaCollectionFragmentFacet,
  JSONSchemaEnumFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
  type JSONSchemaFragmentFacetOf,
} from './index.js';

/**
 * Small collection, used in the tests below: references resolving to a fragment, recursively, and not resolving at all
 */
const _schema = {
  $defs: {
    Role: { enum: ['student', 'teacher'] },
    HasRole: { $ref: '#/$defs/Role' },
    Node: { type: 'object', properties: { next: { $ref: '#/$defs/Node' } } },
    Missing: { $ref: '#/$defs/Nothing' },
    External: { $ref: 'https://example.com/schema.json' },
    Nested: { $ref: '#/$defs/Node/properties/next' },
  },
} as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  // Runtime tests of ReferenceFragment.ts. The tree mirrors the type layer's `JSONSchema > JSONSchema fragments` tree in
  // src/schema/JSONSchema/ReferenceFragment.test-d.ts, so the two layers' tests line up.
  describe('JSONSchema fragment facets', () => {
    // Each file in this directory holds the tests of one facet class under this describe.
    describe('$Ref fragment', () => {
      // JSONSchemaReferenceFragmentFacet: its static `is` (the runtime JSONSchemaFragmentIsReference), the `refName` parsed on construction, the `ref` facets
      // resolved against the collection on access, and the type-only `Type`. Facets are taken from a JSONSchemaCollectionFragmentFacet parsing the small inline
      // collection above, whose references resolve, recurse, or do not resolve (missing, external, a JSON pointer). Each runtime `expect` on a parsed value is
      // paired with an AssertTypeEquality on its static type.
      it('Detects a reference', () => {
        expect(JSONSchemaReferenceFragmentFacet.is({ $ref: '#/$defs/Role' })).toBe(true);
        expect(JSONSchemaReferenceFragmentFacet.is({ $ref: 'https://example.com/schema.json' })).toBe(true);
      });

      it('Rejects a non-reference', () => {
        expect(JSONSchemaReferenceFragmentFacet.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaReferenceFragmentFacet.is({ $ref: 1 } as any)).toBe(false);
      });

      it('Gets the name of the referenced fragment', () => {
        const hasRole = new JSONSchemaCollectionFragmentFacet(_schema).$defs.HasRole[0];
        expect(hasRole).toBeInstanceOf(JSONSchemaReferenceFragmentFacet);
        expect(hasRole.refName).toBe('Role');
        expect(true satisfies AssertTypeEquality<typeof hasRole.refName, 'Role'>).toBe(true);
      });

      it('Gets no name for a reference which does not name a fragment of the collection', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const missing = collection.$defs.Missing[0];
        expect(missing.refName).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof missing.refName, undefined>).toBe(true);
        expect(collection.$defs.External[0].refName).toBe(undefined);
        // JSON pointers are not supported (yet): a reference can only point directly into `$defs`
        const nested = collection.$defs.Nested[0];
        expect(nested.refName).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof nested.refName, undefined>).toBe(true);
      });

      it('Resolves the facets of the referenced fragment, as held by the collection', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const hasRole = collection.$defs.HasRole[0];
        expect(hasRole.ref).toBe(collection.$defs.Role);
        expect(hasRole.ref[0]).toBeInstanceOf(JSONSchemaEnumFragmentFacet);
        expect(true satisfies AssertTypeEquality<typeof hasRole.ref, Array<JSONSchemaEnumFragmentFacet<_Schema, 'Role', _Schema['$defs']['Role']>>>).toBe(true);
      });

      it('Resolves a recursive reference', () => {
        // `ref` is resolved lazily, on access, so a definition referencing itself is parsed once and resolves to its very own facets.
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const facet = collection.$defs.Node[0];
        expect(facet.properties.next[0].ref[0]).toBe(facet);
        expect(facet.properties.next[0].ref[0].properties.next[0].ref[0]).toBe(facet);
        expect(
          true satisfies AssertTypeEquality<
            (typeof facet.properties.next)[0]['ref'][0],
            JSONSchemaModelFragmentFacet<_Schema, 'Node', _Schema['$defs']['Node']>
          >,
        ).toBe(true);
      });

      it('Resolves no facets for an unresolved reference', () => {
        const missing = new JSONSchemaCollectionFragmentFacet(_schema).$defs.Missing[0];
        expect(missing.ref).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof missing.ref, undefined>).toBe(true);
      });

      it('Resolves no facets for a reference with no collection to resolve it against', () => {
        // See AGENTS.md › The collection facet is also what every `$ref` resolves against.
        const reference = new JSONSchemaReferenceFragmentFacet({ $ref: '#/$defs/Role' } as const);
        expect(reference.refName).toBe(undefined);
        expect(reference.ref).toBe(undefined);
      });

      it('Resolves any fragment of the collection for an unspecified reference', () => {
        // An unspecified (`string`) `$ref` may name any definition, so `ref` is a union of every definition's facets and `undefined`, too large to spell out:
        // members of it are picked out with `Extract` instead.
        type Reference = JSONSchemaReferenceFragmentFacet<_Schema, undefined, JSONSchemaReferenceFragment>;
        expect(true satisfies AssertTypeEquality<Reference['refName'], keyof _Schema['$defs'] | undefined>).toBe(true);
        type Ref = Reference['ref'];
        expect(true satisfies AssertTypeEquality<Extract<Ref, undefined>, undefined>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            Extract<Ref, Array<JSONSchemaFragmentFacetOf<_Schema, 'Role', _Schema['$defs']['Role']>>>,
            Array<JSONSchemaFragmentFacetOf<_Schema, 'Role', _Schema['$defs']['Role']>>
          >,
        ).toBe(true);
        type WideReference = JSONSchemaReferenceFragmentFacet<JSONSchemaCollection>;
        expect(true satisfies AssertTypeEquality<WideReference['refName'], JSONSchemaDefinitionName<JSONSchemaCollection> | undefined>).toBe(true);
      });

      it('Infers the type of a reference', () => {
        const collection = new JSONSchemaCollectionFragmentFacet(_schema);
        const _hasRole = collection.$defs.HasRole[0];
        expect(true satisfies AssertTypeEquality<typeof _hasRole.Type, 'student' | 'teacher'>).toBe(true);
        const _missing = collection.$defs.Missing[0];
        expect(true satisfies AssertTypeEquality<typeof _missing.Type, unknown>).toBe(true);
      });
    });
  });
});
