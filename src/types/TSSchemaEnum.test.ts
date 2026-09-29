import { describe, it, expect } from 'vitest';
import { AssertTypeInequality } from '@ofzza/TSstd';

import type { default as schoolJsonSchema } from '../../res/school';
type SchoolJsonSchema = typeof schoolJsonSchema;
//   ^?

describe('TSSchemaEnum', () => {
  it('Imported testing schema', () => {
    expect(true satisfies AssertTypeInequality<SchoolJsonSchema, any>).toBe(true);
  });

  it('TSSchemaEnumType', () => {
    // FIXME: Implement type inference testing
  });
});
