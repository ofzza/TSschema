import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentName } from './JSONSchema/index.js';
import type { TSSchemaCollection, TSSchemaFragmentName, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection.js';
import type { TSSchemaFragment } from './TSSchemaFragment.js';
import type { TSSchemaProperty } from './TSSchemaProperty.js';

import type { default as schoolJsonSchema } from '../../res/school.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?

describe('TSSchemaCollection', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  describe('TSSchemaCollection', () => {
    it('Wraps a collection', () => {
      type SchoolCollection = TSSchemaCollection<JSONSchemaSchoolCollection>;
      //   ^?
      expect(true satisfies AssertTypeEquality<SchoolCollection['__collection'], JSONSchemaSchoolCollection>).toBe(true);
    });

    it('Wraps the default collection when none is given', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaCollection['__collection'], JSONSchemaCollection>).toBe(true);
    });
  });

  describe('UnwrapJSONSchemaCollectionWrapper', () => {
    it('Unwraps a collection wrapper', () => {
      type Unwrapped = UnwrapJSONSchemaCollectionWrapper<TSSchemaCollection<JSONSchemaSchoolCollection>>;
      expect(true satisfies AssertTypeEquality<Unwrapped, JSONSchemaSchoolCollection>).toBe(true);
    });

    it('Returns a collection that is not wrapped as is', () => {
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<JSONSchemaSchoolCollection>, JSONSchemaSchoolCollection>).toBe(true);
    });

    it('Unwraps the parent collection of a fragment or model property wrapper', () => {
      type FragmentWrapper = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
      type PropertyWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<FragmentWrapper>, JSONSchemaSchoolCollection>).toBe(true);
      expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<PropertyWrapper>, JSONSchemaSchoolCollection>).toBe(true);
    });
  });

  describe('TSSchemaFragmentName', () => {
    it('Gets the fragment names of a collection or a collection wrapper', () => {
      type SchoolFragmentName = TSSchemaFragmentName<TSSchemaCollection<JSONSchemaSchoolCollection>>;
      //   ^?
      expect(
        true satisfies AssertTypeEquality<
          SchoolFragmentName,
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
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<JSONSchemaSchoolCollection>, SchoolFragmentName>).toBe(true);
      expect(true satisfies AssertTypeEquality<SchoolFragmentName, JSONSchemaFragmentName<JSONSchemaSchoolCollection>>).toBe(true);
    });

    it('Gets the fragment names of the parent collection of a fragment or model property wrapper', () => {
      type FragmentWrapper = TSSchemaFragment<JSONSchemaSchoolCollection, 'Assessment'>;
      type PropertyWrapper = TSSchemaProperty<JSONSchemaSchoolCollection, 'Assessment', 'title'>;
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<FragmentWrapper>, TSSchemaFragmentName<JSONSchemaSchoolCollection>>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<PropertyWrapper>, TSSchemaFragmentName<JSONSchemaSchoolCollection>>).toBe(true);
    });

    it('Gets string | number fragment names from the default collection', () => {
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName, string | number>).toBe(true);
      expect(true satisfies AssertTypeEquality<TSSchemaFragmentName<TSSchemaCollection>, string | number>).toBe(true);
    });
  });
});
