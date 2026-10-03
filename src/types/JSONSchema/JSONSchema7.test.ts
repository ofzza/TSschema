import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaPrimitiveType, JSONSchemaPrimitiveTypeFromName, JSONSchemaPrimitiveTypeName } from './index.js';

import type { default as schoolJsonSchema } from '../../../res/school.js';
type JSONSchemaSchoolCollection = typeof schoolJsonSchema;
//   ^?

describe('JSONSchema', () => {
  it('Imports the testing schema with literal types', () => {
    expect(true satisfies AssertTypeInequality<JSONSchemaSchoolCollection, any>).toBe(true);
  });

  describe('Primitive types', () => {
    it('Lists all primitive type names', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeName, 'string' | 'boolean' | 'number' | 'integer' | 'null'>).toBe(true);
    });

    it('Lists all primitive value types', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveType, string | number | boolean | null>).toBe(true);
    });

    it('Maps primitive type names to their types', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string'>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'number'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'integer'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'boolean'>, boolean>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'null'>, null>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string' | 'null'>, string | null>).toBe(true);
    });
  });
});
