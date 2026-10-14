import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchema7, JSONSchemaPrimitiveTypeName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaPrimitiveTypeNames, getJSONSchemaKeyword, isJSONSchemaObject, isJSONSchemaPrimitiveTypeName, type JSONSchemaKeyword } from './index.js';

describe('Reflection', () => {
  // Runtime tests of JSONSchema7.ts, the runtime counterpart of the type layer's src/schema/JSONSchema/JSONSchema7.test.ts (its `JSONSchema > Primitive types`
  // mirrored as `Reflection > Primitive types`), plus the runtime only schema object check and keyword reader.
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

  describe('Keywords', () => {
    // getJSONSchemaKeyword and its type-level mirror JSONSchemaKeyword, reading any keyword's value by its value type (vendor keywords included), checked by
    // runtime expects on inline fragments paired with AssertTypeEquality on the inferred literal types.
    it('Reads a keyword of the given value type', () => {
      const fragment = { type: 'number', minimum: 1, 'x-tags': ['a'], deprecated: true } as const;
      expect(getJSONSchemaKeyword(fragment, 'minimum', 'number')).toBe(1);
      expect(getJSONSchemaKeyword(fragment, 'x-tags', 'array')).toEqual(['a']);
      expect(getJSONSchemaKeyword(fragment, 'deprecated', 'boolean')).toBe(true);
      expect(getJSONSchemaKeyword(fragment, 'type', 'unknown')).toBe('number');
      expect(true satisfies AssertTypeEquality<JSONSchemaKeyword<typeof fragment, 'minimum', number>, 1>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaKeyword<typeof fragment, 'x-tags', ReadonlyArray<unknown>>, readonly ['a']>).toBe(true);
    });

    it('Reads an absent keyword, a keyword of another value type, or a keyword of a boolean schema as undefined', () => {
      const fragment = { type: 'number', minimum: '1' } as const;
      expect(getJSONSchemaKeyword(fragment, 'maximum', 'number')).toBe(undefined);
      expect(getJSONSchemaKeyword(fragment, 'minimum', 'number')).toBe(undefined);
      expect(getJSONSchemaKeyword(true, 'minimum', 'number')).toBe(undefined);
      expect(true satisfies AssertTypeEquality<JSONSchemaKeyword<typeof fragment, 'maximum', number>, undefined>).toBe(true);
      expect(true satisfies AssertTypeEquality<JSONSchemaKeyword<typeof fragment, 'minimum', number>, undefined>).toBe(true);
    });

    it('Infers an optional keyword as possibly undefined', () => {
      // E.g. the keywords of the unspecified fragment, which declares them all as optional
      expect(true satisfies AssertTypeEquality<JSONSchemaKeyword<JSONSchema7, 'minimum', number>, number | undefined>).toBe(true);
    });
  });
});
