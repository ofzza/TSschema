import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaReferenceFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaEnumFragmentReflect,
  JSONSchemaModelFragmentReflect,
  JSONSchemaReferenceFragmentReflect,
  type JSONSchemaFragmentReflection,
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
  describe('JSONSchema fragment reflections', () => {
    describe('$Ref fragment', () => {
      it('Detects a reference', () => {
        expect(JSONSchemaReferenceFragmentReflect.check({ $ref: '#/$defs/Role' })).toBe(true);
        expect(JSONSchemaReferenceFragmentReflect.check({ $ref: 'https://example.com/schema.json' })).toBe(true);
      });

      it('Rejects a non-reference', () => {
        expect(JSONSchemaReferenceFragmentReflect.check({ type: 'string' })).toBe(false);
        expect(JSONSchemaReferenceFragmentReflect.check({ $ref: 1 } as any)).toBe(false);
      });

      it('Gets the name of the referenced fragment', () => {
        const hasRole = new JSONSchemaCollectionFragmentReflect(_schema).fragment('HasRole')[0];
        expect(hasRole).toBeInstanceOf(JSONSchemaReferenceFragmentReflect);
        expect(hasRole.refName).toBe('Role');
        expect(true satisfies AssertTypeEquality<typeof hasRole.refName, 'Role'>).toBe(true);
      });

      it('Gets no name for a reference which does not name a fragment of the collection', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const missing = collection.fragment('Missing')[0];
        expect(missing.refName).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof missing.refName, undefined>).toBe(true);
        expect(collection.fragment('External')[0].refName).toBe(undefined);
        // JSON pointers are not supported (yet): a reference can only point directly into `$defs`
        const nested = collection.fragment('Nested')[0];
        expect(nested.refName).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof nested.refName, undefined>).toBe(true);
      });

      it('Resolves the reflections of the referenced fragment, as held by the collection', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const hasRole = collection.fragment('HasRole')[0];
        expect(hasRole.ref).toBe(collection.fragment('Role'));
        expect(hasRole.ref[0]).toBeInstanceOf(JSONSchemaEnumFragmentReflect);
        expect(true satisfies AssertTypeEquality<typeof hasRole.ref, Array<JSONSchemaEnumFragmentReflect<_Schema, 'Role', _Schema['$defs']['Role']>>>).toBe(
          true,
        );
      });

      it('Resolves a recursive reference', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const node = collection.fragment('Node')[0];
        expect(node.properties.next[0].ref[0]).toBe(node);
        expect(node.properties.next[0].ref[0].properties.next[0].ref[0]).toBe(node);
        expect(
          true satisfies AssertTypeEquality<
            (typeof node.properties.next)[0]['ref'][0],
            JSONSchemaModelFragmentReflect<_Schema, 'Node', _Schema['$defs']['Node']>
          >,
        ).toBe(true);
      });

      it('Resolves no reflections for an unresolved reference', () => {
        const missing = new JSONSchemaCollectionFragmentReflect(_schema).fragment('Missing')[0];
        expect(missing.ref).toBe(undefined);
        expect(true satisfies AssertTypeEquality<typeof missing.ref, undefined>).toBe(true);
      });

      it('Resolves any fragment of the collection for an unspecified reference', () => {
        type Reference = JSONSchemaReferenceFragmentReflect<_Schema, undefined, JSONSchemaReferenceFragment>;
        expect(true satisfies AssertTypeEquality<Reference['refName'], keyof _Schema['$defs'] | undefined>).toBe(true);
        type Ref = Reference['ref'];
        expect(true satisfies AssertTypeEquality<Extract<Ref, undefined>, undefined>).toBe(true);
        expect(
          true satisfies AssertTypeEquality<
            Extract<Ref, Array<JSONSchemaFragmentReflection<_Schema, 'Role', _Schema['$defs']['Role']>>>,
            Array<JSONSchemaFragmentReflection<_Schema, 'Role', _Schema['$defs']['Role']>>
          >,
        ).toBe(true);
        type WideReference = JSONSchemaReferenceFragmentReflect<JSONSchemaCollection>;
        expect(true satisfies AssertTypeEquality<WideReference['refName'], JSONSchemaFragmentName<JSONSchemaCollection> | undefined>).toBe(true);
      });

      it('Infers the type of a reference', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const _hasRole = collection.fragment('HasRole')[0];
        expect(true satisfies AssertTypeEquality<typeof _hasRole.Type, 'student' | 'teacher'>).toBe(true);
        const _missing = collection.fragment('Missing')[0];
        expect(true satisfies AssertTypeEquality<typeof _missing.Type, unknown>).toBe(true);
      });
    });
  });
});
