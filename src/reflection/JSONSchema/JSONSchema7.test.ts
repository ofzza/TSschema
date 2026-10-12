import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaPrimitiveTypeName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaPrimitiveTypeNames, isJSONSchemaObject, isJSONSchemaPrimitiveTypeName } from './index.js';

describe('Reflection', () => {
  // Runtime tests of JSONSchema7.ts, the runtime counterpart of the type layer's src/schema/JSONSchema/JSONSchema7.test.ts (its `JSONSchema > Primitive types`
  // mirrored as `Reflection > Primitive types`).
  describe('Primitive types', () => {
    // JSONSchemaPrimitiveTypeNames and isJSONSchemaPrimitiveTypeName, checked by runtime expects against the type layer's JSONSchemaPrimitiveTypeName, which
    // the list must match exactly.
    it('Lists all primitive type names', () => {
      expect(JSONSchemaPrimitiveTypeNames).toEqual(['string', 'number', 'integer', 'boolean']);
      expect(true satisfies AssertTypeEquality<(typeof JSONSchemaPrimitiveTypeNames)[number], JSONSchemaPrimitiveTypeName>).toBe(true);
    });

    it('Detects primitive type names', () => {
      expect(['string', 'number', 'integer', 'boolean'].every((name) => isJSONSchemaPrimitiveTypeName(name))).toBe(true);
    });

    it('Rejects anything other than a primitive type name, including null', () => {
      // See AGENTS.md › `null` is not a primitive type.
      expect(['null', 'object', 'array', 'text', undefined, 1].some((name) => isJSONSchemaPrimitiveTypeName(name))).toBe(false);
    });
  });

  describe('Schema objects', () => {
    // isJSONSchemaObject, which tells a schema object apart from a boolean schema, an array or any other value, by runtime expects on a list of values.
    it('Detects schema objects', () => {
      expect(isJSONSchemaObject({})).toBe(true);
      expect(isJSONSchemaObject({ type: 'string' })).toBe(true);
    });

    it('Rejects boolean schemas, arrays and other values', () => {
      expect([true, false, [], [{}], null, undefined, 'object', 1].some((value) => isJSONSchemaObject(value))).toBe(false);
    });
  });
});
