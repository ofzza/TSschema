import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/std-ts';
import type { TSSchemaDefinitionIsEnum } from './TSSchemaDefinitionEnum';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?
type AssessmentJsonSchema = SchoolJsonSchema['$defs']['Assessment'];
//   ^?
type AssessmentKindJsonSchema = SchoolJsonSchema['$defs']['AssessmentKind'];
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

    expect(true satisfies AssertTypeEquality<AssessmentJsonSchemaDefinitionIsEnum, false>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentKindJsonSchemaDefinitionIsEnum, true>).toBe(true);
  });
});
