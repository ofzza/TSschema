import { describe, it, expect } from 'vitest';
import { AssertTypeInequality } from '@ofzza/TSstd';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?

describe('TSSchemaConst', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaConstType', () => {
    // FIXME: Implement type inference testing
  });
});
