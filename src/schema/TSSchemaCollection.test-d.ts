import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaDefinitionName } from './JSONSchema/index.js';
import type { TSSchemaCollection, TSSchemaDefinitionName, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection.js';
import type { TSSchemaFragment } from './TSSchemaFragment.js';
import type { TSSchemaProperty } from './TSSchemaProperty.js';

import type { default as jsonSchema } from '../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?

describe('TSSchemaCollection', () => {
  // Wrapping a collection, unwrapping any wrapper back to its collection, and getting a collection's definition names. Uses the
  // res/sidecar/schema.json fixture, imported through its sidecar for literal types, with the unspecified JSONSchemaCollection as the fallback.
  // Type level only: each AssertTypeEquality is consumed through `expect(true satisfies ...)`, so both Vitest pools check it.
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
  });

  describe('TSSchemaCollection', () => {
    it('Wraps a collection', () => {
      type FixtureCollection = TSSchemaCollection<JSONSchemaFixtureCollection>;
      //   ^?
      expect(true satisfies AssertTypeEquality<FixtureCollection['__collection'], JSONSchemaFixtureCollection>).toBe(true);
    });

    it('Wraps the default collection when none is given', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaCollection['__collection'], JSONSchemaCollection>).toBe(true);
    });
  });

  describe('UnwrapJSONSchemaCollectionWrapper', () => {
    it('Unwraps a collection wrapper', () => {
      type Unwrapped = UnwrapJSONSchemaCollectionWrapper<TSSchemaCollection<JSONSchemaFixtureCollection>>;
      expect(true satisfies AssertTypeEquality<Unwrapped, JSONSchemaFixtureCollection>).toBe(true);
    });

    it('Returns a collection that is not wrapped as is', () => {
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<JSONSchemaFixtureCollection>, JSONSchemaFixtureCollection>).toBe(true);
    });

    it('Unwraps the parent collection of a fragment or model property wrapper', () => {
      type FragmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      type PropertyWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<FragmentWrapper>, JSONSchemaFixtureCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<PropertyWrapper>, JSONSchemaFixtureCollection>).toBe(true);
    });
  });

  describe('TSSchemaDefinitionName', () => {
    it('Gets the definition names of a collection or a collection wrapper', () => {
      type SchemaFragmentName = TSSchemaDefinitionName<TSSchemaCollection<JSONSchemaFixtureCollection>>;
      //   ^?
      expect(
        true satisfies AssertTypeEquality<
          SchemaFragmentName,
          | 'Address'
          | 'Assessment'
          | 'AssessmentKind'
          | 'AssessmentRecord'
          | 'Book'
          | 'BookBinding'
          | 'BookName'
          | 'Building'
          | 'Campus'
          | 'Chapter'
          | 'Class'
          | 'ClassName'
          | 'ClassSession'
          | 'DayOfWeek'
          | 'Department'
          | 'DepartmentName'
          | 'Exercise'
          | 'Library'
          | 'NullableScalarBattery'
          | 'NullableScalarRegister'
          | 'NullableScalarSeries'
          | 'Person'
          | 'PersonRole'
          | 'Room'
          | 'RoomKind'
          | 'ScalarBattery'
          | 'ScalarRegister'
          | 'ScalarSeries'
          | 'School'
          | 'Section'
          | 'Term'
        >,
      ).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaDefinitionName<JSONSchemaFixtureCollection>, SchemaFragmentName>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchemaFragmentName, JSONSchemaDefinitionName<JSONSchemaFixtureCollection>>).toBe(true);
    });

    it('Gets the definition names of the parent collection of a fragment or model property wrapper', () => {
      type FragmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      type PropertyWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaDefinitionName<FragmentWrapper>, TSSchemaDefinitionName<JSONSchemaFixtureCollection>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaDefinitionName<PropertyWrapper>, TSSchemaDefinitionName<JSONSchemaFixtureCollection>>).toBe(true);
    });

    it('Gets string | number definition names from the default collection', () => {
      // The unspecified collection's `$defs` is a `Record<string, ...>`, and `keyof` of a string index signature is `string | number`.
      expect(true satisfies AssertTypeEquality<TSSchemaDefinitionName, string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaDefinitionName<TSSchemaCollection>, string | number>).toBe(true);
    });
  });
});
