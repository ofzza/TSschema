import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaPrimitiveTypeName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaPrimitiveTypeNames, isJSONSchemaObject, isJSONSchemaPrimitiveTypeName } from './index.js';

describe('Reflection', () => {
  describe('Primitive types', () => {
    it('Lists all primitive type names', () => {
      expect(JSONSchemaPrimitiveTypeNames).toEqual(['string', 'number', 'integer', 'boolean']);
      expect(true satisfies AssertTypeEquality<(typeof JSONSchemaPrimitiveTypeNames)[number], JSONSchemaPrimitiveTypeName>).toBe(true);
    });

    it('Detects primitive type names', () => {
      expect(['string', 'number', 'integer', 'boolean'].every((name) => isJSONSchemaPrimitiveTypeName(name))).toBe(true);
    });

    it('Rejects anything other than a primitive type name, including null', () => {
      expect(['null', 'object', 'array', 'text', undefined, 1].some((name) => isJSONSchemaPrimitiveTypeName(name))).toBe(false);
    });
  });

  describe('Schema objects', () => {
    it('Detects schema objects', () => {
      expect(isJSONSchemaObject({})).toBe(true);
      expect(isJSONSchemaObject({ type: 'string' })).toBe(true);
    });

    it('Rejects boolean schemas, arrays and other values', () => {
      expect([true, false, [], [{}], null, undefined, 'object', 1].some((value) => isJSONSchemaObject(value))).toBe(false);
    });
  });
});
