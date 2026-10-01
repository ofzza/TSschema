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
export type JSONSchemaPrimitiveTypeName = Exclude<JSONSchema7TypeName, 'array' | 'object'> | 'byte' | 'long' | 'float' | 'double';
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
        TName extends 'number' | 'byte' | 'long' | 'integer' | 'float' | 'double'
        ? number
        : // boolean
          TName extends 'boolean'
          ? boolean
          : // Fall through to 'never'
            never;

/**
 * Determines if a JSON schema fragment is a collection (i.e., contains a `$defs` property).
 */
export type JSONSchemaFragmentIsCollection<T extends JSONSchema7> = T extends { $defs: infer U }
  ? U extends Record<string, JSONSchema7>
    ? true
    : false
  : false;
/**
 * Represents a JSON schema collection, which is any schema fragment containing a `$defs` property.
 */
export type JSONSchemaFragmentCollection = JSONSchema7 & { $defs: Record<string, JSONSchema7> };
/**
 * Determines if a JSON schema fragment is a definition (i.e., not a collection).
 */
export type JSONSchemaFragmentIsNotCollection<T extends JSONSchema7> = JSONSchemaFragmentIsCollection<T> extends true ? false : true;
/**
 * Represents a JSON schema definition, which is any schema fragment that is not a collection.
 */
export type JSONSchemaFragmentNotCollection = JSONSchema7 & { $defs?: never };

/**
 * Determines if a JSON schema fragment is a model definition (i.e., an object with `properties`).
 */
export type JSONSchemaFragmentIsModel<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { type: 'object'; properties: infer U }
    ? U extends Record<string, JSONSchema7>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema model definition, which is any object schema fragment containing `properties`.
 */
export type JSONSchemaFragmentModel = JSONSchemaFragmentNotCollection & { type: 'object'; properties: Record<string, JSONSchema7> };

/**
 * Determines if a JSON schema fragment is a const definition (i.e., contains a `const` property).
 */
export type JSONSchemaFragmentIsConst<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { const: unknown }
    ? true
    : false
  : false;
/**
 * Represents a JSON schema const definition, which is any schema fragment containing a `const` property.
 */
export type JSONSchemaFragmentConst = JSONSchemaFragmentNotCollection & { const: unknown };

/**
 * Determines if a JSON schema fragment is an enum definition (i.e., contains an `enum` property).
 */
export type JSONSchemaFragmentIsEnum<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { enum: infer U }
    ? U extends Array<unknown> | ReadonlyArray<unknown>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export type JSONSchemaFragmentEnum = JSONSchemaFragmentNotCollection & { enum: Array<unknown> | ReadonlyArray<unknown> };

/**
 * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property).
 */
export type JSONSchemaFragmentIsPrimitiveType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { type: JSONSchemaPrimitiveTypeName }
    ? true
    : false
  : false;
/**
 * Represents a JSON schema primitive type definition, which is any schema fragment containing a `type` property.
 */
export type JSONSchemaFragmentPrimitiveType = JSONSchemaFragmentNotCollection & {
  type: JSONSchemaPrimitiveTypeName;
};

/**
 * Determines if a JSON schema fragment is a array type definition (i.e., contains a `type="array"` property and an optional `items` property).
 */
export type JSONSchemaFragmentIsArrayType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { type: 'array' }
    ? T extends { items: infer U }
      ? U extends JSONSchemaFragmentNotCollection
        ? true
        : false
      : true
    : false
  : false;
/**
 * Represents a JSON schema array type definition, which is any schema fragment containing a `type="array"` property and an optional `items` property.
 */
export type JSONSchemaFragmentArrayType = JSONSchemaFragmentNotCollection & {
  type: 'array';
  items?: JSONSchemaFragmentNotCollection;
};

/**
 * Determines if a JSON schema fragment is a object type definition (i.e., contains a `type="object"` property and no `properties` property).
 */
export type JSONSchemaFragmentIsObjectType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { type: 'object' }
    ? T extends { properties: infer U }
      ? U extends Record<string, JSONSchema7>
        ? false
        : true
      : true
    : false
  : false;
/**
 * Represents a JSON schema object type definition, which is any schema fragment containing a `type="object"` property and no `properties` property.
 */
export type JSONSchemaFragmentObjectType = JSONSchemaFragmentNotCollection & {
  type: 'object';
  properties?: never;
};

/**
 * Determines if a JSON schema fragment is a all-of-types type definition (i.e., contains a `allOf` property).
 */
export type JSONSchemaFragmentIsAllOfType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { allOf: infer U }
    ? U extends Array<JSONSchemaFragmentNotCollection> | ReadonlyArray<JSONSchemaFragmentNotCollection>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema all-of-types definition, which is any schema fragment containing a `allOf` property.
 */
export type JSONSchemaFragmentAllOfType = JSONSchemaFragmentNotCollection & {
  allOf: Array<JSONSchemaFragmentNotCollection> | ReadonlyArray<JSONSchemaFragmentNotCollection>;
};

/**
 * Determines if a JSON schema fragment is a any-of-types type definition (i.e., contains a `anyOf` property).
 */
export type JSONSchemaFragmentIsAnyOfType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { anyOf: infer U }
    ? U extends Array<JSONSchemaFragmentNotCollection> | ReadonlyArray<JSONSchemaFragmentNotCollection>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema any-of-types definition, which is any schema fragment containing a `anyOf` property.
 */
export type JSONSchemaFragmentAnyOfType = JSONSchemaFragmentNotCollection & {
  anyOf: Array<JSONSchemaFragmentNotCollection> | ReadonlyArray<JSONSchemaFragmentNotCollection>;
};

/**
 * Determines if a JSON schema fragment is a one-of-types type definition (i.e., contains a `oneOf` property).
 */
export type JSONSchemaFragmentIsOneOfType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { oneOf: infer U }
    ? U extends Array<JSONSchemaFragmentNotCollection> | ReadonlyArray<JSONSchemaFragmentNotCollection>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema one-of-types definition, which is any schema fragment containing a `oneOf` property.
 */
export type JSONSchemaFragmentOneOfType = JSONSchemaFragmentNotCollection & {
  oneOf: Array<JSONSchemaFragmentNotCollection> | ReadonlyArray<JSONSchemaFragmentNotCollection>;
};

/**
 * Determines if a JSON schema fragment is a not-types type definition (i.e., contains a `not` property).
 */
export type JSONSchemaFragmentIsNotType<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { not: infer U }
    ? U extends JSONSchemaFragmentNotCollection
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema not-types definition, which is any schema fragment containing a `not` property.
 */
export type JSONSchemaFragmentNotType = JSONSchemaFragmentNotCollection & {
  not: JSONSchemaFragmentNotCollection;
};

/**
 * Determines if a JSON schema fragment is a reference definition (i.e., contains a `$ref` property).
 */
export type JSONSchemaFragmentIsReference<T extends JSONSchema7> = T extends JSONSchemaFragmentNotCollection
  ? T extends { $ref: string }
    ? true
    : false
  : false;
/**
 * Represents a JSON schema reference definition, which is any schema fragment containing a `$ref` property.
 */
export type JSONSchemaFragmentReference = JSONSchemaFragmentNotCollection & {
  $ref: string;
};
