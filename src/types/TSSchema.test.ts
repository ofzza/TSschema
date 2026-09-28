import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { JSONSchema7 } from './JSONSchema';
import type { UnwrapJSONSchemaWrapper, TSSchema } from './TSSchema';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?

describe('TSSchema', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('UnwrapJSONSchemaWrapper', () => {
    type UnwrappedSchoolSchema = UnwrapJSONSchemaWrapper<SchoolJsonSchema>;
    //   ^?
    type UnwrappedSchoolSchemaWrapper = UnwrapJSONSchemaWrapper<TSSchema<SchoolJsonSchema>>;
    //   ^?

    // Unwrapping a JSON schema or a JSON schema wrapper should yield the same type
    expect(true satisfies AssertTypeEquality<UnwrappedSchoolSchema, UnwrappedSchoolSchemaWrapper>).toBe(true);
  });

  it('TSSchema', () => {
    type DefaultSchoolSchema = TSSchema;
    //   ^?
    type TSSchoolSchema = TSSchema<SchoolJsonSchema>;
    //   ^?

    // Default TSSchema should have JSONSchema7 as its underlying schema type
    expect(true satisfies AssertTypeEquality<DefaultSchoolSchema['__schema'], JSONSchema7>).toBe(true);
    // TSSchema with a specific JSON schema should have that schema as its underlying type
    expect(true satisfies AssertTypeEquality<TSSchoolSchema['__schema'], SchoolJsonSchema>).toBe(true);
  });
});
