import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeInequality } from '@ofzza/tsstd';
import type { JSONSchemaPrimitiveType, JSONSchemaPrimitiveTypeFromName, JSONSchemaPrimitiveTypeName } from './index.js';

import type { default as jsonSchema } from '../../../res/sidecar/schema.json';
type JSONSchemaFixtureCollection = typeof jsonSchema;
//   ^?

describe('JSONSchema', () => {
  // Type layer tests of JSONSchema7.ts: the importing of the res/schema.json fixture with literal types, and the primitive type name / value type utilities.
  // Tested at type level only, by AssertTypeEquality (and AssertTypeInequality) against hand-written types, with a `@ts-expect-error` for what must not
  // compile. Kept as `JSONSchema > Primitive types` from when src/schema/JSONSchema/ was a single file; src/reflection/JSONSchema/JSONSchema7.test.ts mirrors
  // it at runtime.
  it('Imports the testing schema with literal types', () => {
    // Every other test relies on the sidecar typing the fixture's JSON with literal types: if it were `any`, their assertions would hold vacuously.
    expect(true satisfies AssertTypeInequality<JSONSchemaFixtureCollection, any>).toBe(true);
  });

  describe('Primitive types', () => {
    // JSONSchemaPrimitiveTypeName, JSONSchemaPrimitiveType and JSONSchemaPrimitiveTypeFromName, which cover `string`, `number`, `integer` and `boolean`.
    it('Lists all primitive type names', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeName, 'string' | 'boolean' | 'number' | 'integer'>).toBe(true);
    });

    it('Lists all primitive value types', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveType, string | number | boolean>).toBe(true);
    });

    it('Maps primitive type names to their types', () => {
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string'>, string>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'number'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'integer'>, number>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'boolean'>, boolean>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'string' | 'boolean'>, string | boolean>).toBe(true);
    });

    it('Does not treat null as a primitive type', () => {
      // See AGENTS.md › `null` is not a primitive type.
      // @ts-expect-error `null` is not a primitive type name
      expect(true satisfies AssertTypeEquality<JSONSchemaPrimitiveTypeFromName<'null'>, null>).toBe(true);
    });
  });
});
