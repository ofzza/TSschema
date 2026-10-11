/**
 * Runtime counterparts of the JSON Schema Draft 7 type utilities: the primitive type names, and telling schema objects apart from boolean schemas.
 */

import type { JSONSchemaPrimitiveTypeName } from '../../schema/JSONSchema/index.js';

/**
 * Names of all primitive types. `null` is not a primitive type here: like `object` and `array`, it has a fragment reflection of its own.
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
