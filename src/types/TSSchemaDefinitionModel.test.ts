import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/std-ts';
import type { TSSchemaDefinitionIsModel } from './TSSchemaDefinitionModel';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?
type AssessmentJsonSchema = SchoolJsonSchema['$defs']['Assessment'];
//   ^?
type AssessmentKindJsonSchema = SchoolJsonSchema['$defs']['AssessmentKind'];
//   ^?

describe('TSSchemaModel', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaDefinitionIsModel', () => {
    type AssessmentJsonSchemaDefinitionIsModel = TSSchemaDefinitionIsModel<AssessmentJsonSchema>;
    //   ^?
    type AssessmentKindJsonSchemaDefinitionIsModel = TSSchemaDefinitionIsModel<AssessmentKindJsonSchema>;
    //   ^?

    expect(true satisfies AssertTypeEquality<AssessmentJsonSchemaDefinitionIsModel, true>).toBe(true);
    expect(true satisfies AssertTypeEquality<AssessmentKindJsonSchemaDefinitionIsModel, false>).toBe(true);
  });
});
