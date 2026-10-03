/**
 * JSON Schema Draft 7 schema type override, which makes every property optionally read-only so that schemas can be referenced as `as const`
 * constants and keep their literal types for inference, and the primitive value type names and types it is built from.
 */

import type {
  JSONSchema7 as OriginalJSONSchema,
  JSONSchema7Array as OriginalJSONSchemaArray,
  JSONSchema7Object as OriginalJSONSchemaObject,
  JSONSchema7Type as OriginalJSONSchemaType,
  JSONSchema7TypeName as OriginalJSONSchemaTypeName,
} from 'json-schema';

/**
 * Makes every property of a type, recursively, optional and read-only
 */
type _DeepOptionallyReadOnly<T> = {
  readonly [K in keyof T]?: _DeepOptionallyReadOnly<T[K]>;
};

/**
 * JSON Schema Draft 7 schema type, with every property made optional and read-only recursively so that `as const` schemas are assignable to it
 */
export type JSONSchema7 = _DeepOptionallyReadOnly<OriginalJSONSchema>;

/**
 * Primitive value type names
 */
export type JSONSchemaPrimitiveTypeName = Exclude<OriginalJSONSchemaTypeName, 'array' | 'object'>;
/**
 * Primitive value types
 */
export type JSONSchemaPrimitiveType = Exclude<OriginalJSONSchemaType, OriginalJSONSchemaObject | OriginalJSONSchemaArray>;
/**
 * Maps a primitive type name, or a union of primitive type names, to its corresponding TypeScript type
 */
export type JSONSchemaPrimitiveTypeFromName<TName extends JSONSchemaPrimitiveTypeName> =
  // null
  TName extends 'null'
    ? null
    : // string
      TName extends 'string'
      ? string
      : // number
        TName extends 'number' | 'integer'
        ? number
        : // boolean
          TName extends 'boolean'
          ? boolean
          : // Fall through to 'never'
            never;
