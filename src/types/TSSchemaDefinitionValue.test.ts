import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { TSSchemaDefinitionIsValue } from './TSSchemaDefinitionValue';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?
type AssessmentJsonSchema = SchoolJsonSchema['$defs']['Assessment'];
//   ^?
type AssessmentKindJsonSchema = SchoolJsonSchema['$defs']['AssessmentKind'];
//   ^?
type ColorsEnumJsonSchema = { enum: ['red', 'amber', 'green'] };
//   ^?

describe('TSSchemaValue', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaDefinitionIsValue', () => {
    type AssessmentJsonSchemaDefinitionIsValue = TSSchemaDefinitionIsValue<AssessmentJsonSchema>;
    //   ^?
    type AssessmentKindJsonSchemaDefinitionIsValue = TSSchemaDefinitionIsValue<AssessmentKindJsonSchema>;
    //   ^?
    type ColorsEnumJsonSchemaDefinitionIsEnum = TSSchemaDefinitionIsValue<ColorsEnumJsonSchema>;
    //   ^?

    expect(true satisfies AssertTypeEquality<AssessmentJsonSchemaDefinitionIsValue, false>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentKindJsonSchemaDefinitionIsValue, true>).toBe(true);
    expect(true satisfies AssertTypeEquality<ColorsEnumJsonSchemaDefinitionIsEnum, false>).toBe(true);
  });
});
