import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/TSstd';
import type { TSSchemaDefinitionIsEnum } from './TSSchemaDefinitionEnum';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?
type AssessmentJsonSchema = SchoolJsonSchema['$defs']['Assessment'];
//   ^?
type AssessmentKindJsonSchema = SchoolJsonSchema['$defs']['AssessmentKind'];
//   ^?
type ColorsEnumJsonSchema = { enum: ['red', 'amber', 'green'] };
//   ^?

describe('TSSchemaEnum', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaDefinitionIsEnum', () => {
    type AssessmentJsonSchemaDefinitionIsEnum = TSSchemaDefinitionIsEnum<AssessmentJsonSchema>;
    //   ^?
    type AssessmentKindJsonSchemaDefinitionIsEnum = TSSchemaDefinitionIsEnum<AssessmentKindJsonSchema>;
    //   ^?
    type ColorsEnumJsonSchemaDefinitionIsEnum = TSSchemaDefinitionIsEnum<ColorsEnumJsonSchema>;
    //   ^?

    expect(true satisfies AssertTypeEquality<AssessmentJsonSchemaDefinitionIsEnum, false>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentKindJsonSchemaDefinitionIsEnum, false>).toBe(true);
    expect(true satisfies AssertTypeEquality<ColorsEnumJsonSchemaDefinitionIsEnum, true>).toBe(true);
  });
});
