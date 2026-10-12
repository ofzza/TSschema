import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import {
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaEnumFragmentReflect,
  JSONSchemaFragmentReflect,
  JSONSchemaModelFragmentReflect,
  type JSONSchemaCollectionReflectedFragment,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentReflection,
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
  describe('JSONSchema fragment reflections', () => {
    describe('Collection fragment', () => {
      it('Detects a collection', () => {
        expect(JSONSchemaCollectionFragmentReflect.check(_schema)).toBe(true);
        expect(JSONSchemaCollectionFragmentReflect.check(jsonSchema)).toBe(true);
        expect(JSONSchemaCollectionFragmentReflect.check({ $defs: {} })).toBe(true);
      });

      it('Rejects a non-collection', () => {
        expect(JSONSchemaCollectionFragmentReflect.check({ type: 'object' })).toBe(false);
        expect(JSONSchemaCollectionFragmentReflect.check({ $defs: [] } as any)).toBe(false);
        expect(JSONSchemaCollectionFragmentReflect.check({ $defs: true } as any)).toBe(false);
      });

      it('Gets the names of all fragments of the collection', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        expect(collection.names).toEqual(['Person', 'Role']);
        expect(true satisfies AssertTypeEquality<typeof collection.names, Array<'Person' | 'Role'>>).toBe(true);
        expect(new JSONSchemaCollectionFragmentReflect(jsonSchema).names).toEqual(Object.keys(jsonSchema.$defs));
      });

      it('Reflects each fragment of the collection, addressed by name', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        const person = collection.$defs.Person;
        expect(person.length).toBe(1);
        expect(person[0]).toBeInstanceOf(JSONSchemaModelFragmentReflect);
        expect(person[0].name).toBe('Person');
        expect(person[0].fragment).toBe(_schema.$defs.Person);
        expect(true satisfies AssertTypeEquality<typeof person, Array<JSONSchemaModelFragmentReflect<_Schema, 'Person', _Schema['$defs']['Person']>>>).toBe(
          true,
        );
        const role = collection.$defs.Role;
        expect(role[0]).toBeInstanceOf(JSONSchemaEnumFragmentReflect);
        expect(true satisfies AssertTypeEquality<typeof role, Array<JSONSchemaEnumFragmentReflect<_Schema, 'Role', _Schema['$defs']['Role']>>>).toBe(true);
      });

      it('Reflects the fragments of the fixture collection', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(jsonSchema);
        const assessment = collection.$defs.Assessment[0];
        expect(assessment).toBeInstanceOf(JSONSchemaModelFragmentReflect);
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

      it('Reflects the collection as a fragment reflection of the whole schema', () => {
        const collection = new JSONSchemaCollectionFragmentReflect(_schema);
        expect(collection).toBeInstanceOf(JSONSchemaFragmentReflect);
        expect(collection.name).toBe(undefined);
        expect(collection.fragment).toBe(_schema);
        expect(true satisfies AssertTypeEquality<typeof collection.name, undefined>).toBe(true);
        expect(true satisfies AssertTypeEquality<typeof collection.fragment, _Schema>).toBe(true);
      });

      it('Infers the value type of the collection from its root fragment, leaving out its $defs', () => {
        const _collection = new JSONSchemaCollectionFragmentReflect(_schema);
        expect(true satisfies AssertTypeEquality<typeof _collection.Type, JSONSchemaFragmentType<JSONSchemaCollectionRootFragment<_Schema>, _Schema>>).toBe(
          true,
        );
        expect(true satisfies AssertTypeEquality<keyof JSONSchemaCollectionRootFragment<_Schema>, 'title' | 'type' | 'properties'>).toBe(true);
      });

      it('Reflects no fragments for a collection with empty $defs', () => {
        const collection = new JSONSchemaCollectionFragmentReflect({ $defs: {} });
        expect(collection.names).toEqual([]);
        expect(collection.$defs).toEqual({});
      });

      it('Reflects any fragment of an unspecified collection', () => {
        const collection = new JSONSchemaCollectionFragmentReflect({ $defs: { A: { type: 'string' } } } as JSONSchemaCollection);
        expect(collection.$defs.A.length).toBe(1);
        expect(
          true satisfies AssertTypeEquality<
            (typeof collection.$defs)[string],
            Array<JSONSchemaFragmentReflection<JSONSchemaCollection, string, JSONSchemaNotCollectionFragment>>
          >,
        ).toBe(true);
      });
    });

    describe('Collection reflected fragment', () => {
      it('Gets a fragment of a collection, as reflected', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaCollectionReflectedFragment<_Schema, 'Role'>, _Schema['$defs']['Role']>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaCollectionReflectedFragment<JSONSchemaCollection, string>, JSONSchemaNotCollectionFragment>).toBe(
          true,
        );
      });
    });
  });
});
