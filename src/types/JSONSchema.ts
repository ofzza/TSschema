/**
 * Overrides for JSON Schema types to make certain properties optional and compatible with the project's requirements: Due to a requirement of referencing
 * a JSON schema as a constant, certain properties need to be optionally read-only.
 */

import type { JSONSchema7 as OriginalJSONSchema7, JSONSchema7Array, JSONSchema7Object, JSONSchema7Type, JSONSchema7TypeName } from 'json-schema';

type DeepOptionallyReadOnly<T> = {
  readonly [K in keyof T]?: DeepOptionallyReadOnly<T[K]>;
};

// Overrides model definitions
export type JSONSchema7 = DeepOptionallyReadOnly<OriginalJSONSchema7>;

/**
 * Primitive value type names
 */
export type JSONSchemaPrimitiveTypeName = Exclude<JSONSchema7TypeName, 'array' | 'object'>;
/**
 * Primitive value types
 */
export type JSONSchemaPrimitiveType = Exclude<JSONSchema7Type, JSONSchema7Object | JSONSchema7Array>;
/**
 * Maps a primitive type name to its corresponding TypeScript type
 */
export type JSONSchemaPrimitiveTypeFromName<TName extends JSONSchemaPrimitiveTypeName> =
  // null
  TName extends 'null'
    ? null
    : // string
      TName extends 'string'
      ? string
      : // number
        TName extends 'number' | 'integer' | 'float' | 'double'
        ? number
        : // boolean
          TName extends 'boolean'
          ? boolean
          : // Fall through to 'never'
            never;

/**
 * Determines if a JSON schema is a collection (i.e., contains a `$defs` property).
 */
export type JSONSchemaIsCollection<T extends JSONSchema7> = T extends { $defs: infer U } ? (U extends Record<string, JSONSchema7> ? true : false) : false;
/**
 * Represents a JSON schema collection, which is a schema containing a `$defs` property.
 */
export type JSONSchemaCollection = JSONSchema7 & { $defs: Record<string, JSONSchema7> };
/**
 * Determines if a JSON schema is a definition (i.e., not a collection).
 */
export type JSONSchemaIsNotCollection<T extends JSONSchema7> = JSONSchemaIsCollection<T> extends true ? false : true;
/**
 * Represents a JSON schema definition, which is a schema that is not a collection.
 */
export type JSONSchemaNotCollection = JSONSchema7 & { $defs?: never };
/**
 * Determines if a JSON schema is a const definition (i.e., contains a `const` property).
 */
export type JSONSchemaIsConst<T extends JSONSchema7> = T extends JSONSchemaNotCollection ? (T extends { const: unknown } ? true : false) : false;
/**
 * Represents a JSON schema const definition, which is a schema containing a `const` property.
 */
export type JSONSchemaConst = JSONSchemaNotCollection & { const: unknown };
/**
 * Determines if a JSON schema is an enum definition (i.e., contains an `enum` property).
 */
export type JSONSchemaIsEnum<T extends JSONSchema7> = T extends JSONSchemaNotCollection
  ? T extends { enum: infer U }
    ? U extends Array<unknown>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema enum definition, which is a schema containing an `enum` property.
 */
export type JSONSchemaEnum = JSONSchemaNotCollection & { enum: Array<unknown> };
/**
 * Determines if a JSON schema is a model definition (i.e., an object with `properties`).
 */
export type JSONSchemaIsModel<T extends JSONSchema7> = T extends JSONSchemaNotCollection
  ? T extends { type: 'object'; properties: infer U }
    ? U extends Record<string, JSONSchema7>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema model definition, which is an object schema containing `properties`.
 */
export type JSONSchemaModel = JSONSchemaNotCollection & { type: 'object'; properties: Record<string, JSONSchema7> };
/**
 * Determines if a JSON schema is a value definition (i.e., a primitive or combined type).
 */
export type JSONSchemaIsValue<T extends JSONSchema7> =
  JSONSchemaIsCollection<T> extends true // Check not collection
    ? false
    : JSONSchemaIsConst<T> extends true // Check not const definition
      ? false
      : JSONSchemaIsEnum<T> extends true // Check not enum definition
        ? false
        : JSONSchemaIsModel<T> extends true // Check not model definition
          ? false
          : T extends { type: JSONSchema7TypeName } // Has explicit primitive type
            ? true
            : T extends { allOf: unknown } // Has combined "allOf" type
              ? true
              : T extends { anyOf: unknown } // Has combined "anyOf" type
                ? true
                : T extends { oneOf: unknown } // Has combined "oneOf" type
                  ? true
                  : T extends { not: unknown } // Has combined "not" type
                    ? true
                    : false;
/**
 * Represents a JSON schema value definition, which is a primitive or combined type schema.
 */
export type JSONSchemaValue = JSONSchemaNotCollection &
  ({ type: JSONSchema7TypeName } | { allOf: unknown } | { anyOf: unknown } | { oneOf: unknown } | { not: unknown });
