/**
 * Runtime counterparts of the JSON Schema Draft 7 type utilities: the primitive type names, and telling schema objects apart from boolean schemas.
 */

import type { JSONSchemaPrimitiveTypeName } from '../../schema/JSONSchema/index.js';

/**
 * Names of all primitive types. `null` is not a primitive type here: like `object` and `array`, it has a fragment facet of its own.
 */
export const JSONSchemaPrimitiveTypeNames: ReadonlyArray<JSONSchemaPrimitiveTypeName> = ['string', 'number', 'integer', 'boolean'];

/**
 * Determines if a value is a primitive type name
 * @param value Value to check
 * @returns `true` if the value names a primitive type
 */
export function isJSONSchemaPrimitiveTypeName(value: unknown): value is JSONSchemaPrimitiveTypeName {
  return JSONSchemaPrimitiveTypeNames.includes(value as JSONSchemaPrimitiveTypeName);
}

/**
 * Determines if a value is a (non-array) object, i.e. a JSON schema object rather than a boolean schema or an array
 * @param value Value to check
 * @returns `true` if the value is a non-array object
 */
export function isJSONSchemaObject(value: unknown): value is object {
  return value instanceof Object && !(value instanceof Array);
}

/**
 * Gets the name of a `const` or `enum` value, used where the schema names none: a string is its own name, any other primitive (number, boolean, `null`)
 * its string form, and an object or array its JSON. The runtime counterpart of `JSONSchemaValueName`.
 * @param value Value to name
 * @returns Name of the value
 */
export function getJSONSchemaValueName<TValue>(value: TValue): JSONSchemaValueName<TValue> {
  return (
    typeof value === 'string' ? value : value === null || typeof value !== 'object' ? String(value) : JSON.stringify(value)
  ) as JSONSchemaValueName<TValue>;
}

/**
 * Infers the name of a `const` or `enum` value (see `getJSONSchemaValueName`): a string literal as is, any other primitive literal in its string form, and
 * `string` for an object or array
 */
export type JSONSchemaValueName<TValue> =
  // String
  TValue extends string
    ? TValue
    : // Any other primitive
      TValue extends number | boolean | null | undefined | bigint
      ? `${TValue}`
      : // Object or array
        string;
