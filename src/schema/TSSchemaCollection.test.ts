import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentName } from './JSONSchema/index.js';
import type { TSSchemaCollection, TSSchemaFragmentName, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection.js';
import type { TSSchemaFragment } from './TSSchemaFragment.js';
import type { TSSchemaProperty } from './TSSchemaProperty.js';

import type { default as jsonSchema } from '../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?

describe('TSSchemaCollection', () => {
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

  describe('TSSchemaFragmentName', () => {
    it('Gets the fragment names of a collection or a collection wrapper', () => {
      type SchemaFragmentName = TSSchemaFragmentName<TSSchemaCollection<JSONSchemaFixtureCollection>>;
      //   ^?
      expect(
        true satisfies AssertTypeEquality<
          SchemaFragmentName,
          | 'Address'
          | 'Assessment'
          | 'AssessmentKind'
          | 'AssessmentRecord'
          | 'Book'
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
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<JSONSchemaFixtureCollection>, SchemaFragmentName>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchemaFragmentName, JSONSchemaFragmentName<JSONSchemaFixtureCollection>>).toBe(true);
    });

    it('Gets the fragment names of the parent collection of a fragment or model property wrapper', () => {
      type FragmentWrapper = TSSchemaFragment<JSONSchemaFixtureCollection, 'Assessment'>;
      type PropertyWrapper = TSSchemaProperty<JSONSchemaFixtureCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<FragmentWrapper>, TSSchemaFragmentName<JSONSchemaFixtureCollection>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<PropertyWrapper>, TSSchemaFragmentName<JSONSchemaFixtureCollection>>).toBe(true);
    });

    it('Gets string | number fragment names from the default collection', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName, string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<TSSchemaCollection>, string | number>).toBe(true);
    });
  });
});
