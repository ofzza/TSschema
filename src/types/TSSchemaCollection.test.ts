import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { JSONSchemaCollection } from './JSONSchema';
import type { TSSchemaName, UnwrapJSONSchemaCollectionWrapper, TSSchemaCollection } from './TSSchemaCollection';

import type { default as schoolJsonSchema } from '../../res/school';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?

describe('TSSchemaCollection', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  it('TSSchemaName', () => {
    type DefaultSchemaDefinitionName = TSSchemaName;
    //   ^?
    type SchoolSchemaDefinitionName = TSSchemaName<TSSchemaCollection<JSONSchemaSchoolCollection>>;
    //   ^?

    // Default TS Schema definition names are typed as string | number | symbol
    expect(true satisfies AssertTypeEquality<DefaultSchemaDefinitionName, string | number>).toBe(true);
    // TSSchema with a specific JSON schema should have the corresponding definition names
    expect(
      true satisfies AssertTypeEquality<
        SchoolSchemaDefinitionName,
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
  });

  it('TSSchemaCollection', () => {
    type DefaultSchoolSchema = TSSchemaCollection;
    //   ^?
    type TSSchoolSchema = TSSchemaCollection<JSONSchemaSchoolCollection>;
    //   ^?

    // Default TSSchema should have JSONSchema7 as its underlying schema type
    expect(true satisfies AssertTypeEquality<DefaultSchoolSchema['__collection'], JSONSchemaCollection>).toBe(true);
    // TSSchema with a specific JSON schema should have that schema as its underlying type
    expect(true satisfies AssertTypeEquality<TSSchoolSchema['__collection'], JSONSchemaSchoolCollection>).toBe(true);
  });

  it('UnwrapJSONSchemaCollectionWrapper', () => {
    type UnwrappedSchoolSchema = UnwrapJSONSchemaCollectionWrapper<JSONSchemaSchoolCollection>;
    //   ^?
    type UnwrappedSchoolSchemaWrapper = UnwrapJSONSchemaCollectionWrapper<TSSchemaCollection<JSONSchemaSchoolCollection>>;
    //   ^?

    // Unwrapping a JSON schema or a JSON schema wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedSchoolSchema, UnwrappedSchoolSchemaWrapper>).toBe(true);
  });
});
