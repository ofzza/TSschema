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
        TName extends 'number' | 'integer'
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
export type JSONSchemaCollection = JSONSchema7 & { $defs: Record<string, JSONSchema7> };
/**
 * Determines if a JSON schema fragment is a definition (i.e., not a collection).
 */
export type JSONSchemaFragmentIsNotCollection<T extends JSONSchema7> = JSONSchemaFragmentIsCollection<T> extends true ? false : true;
/**
 * Represents a JSON schema definition, which is any schema fragment that is not a collection.
 */
export type JSONSchemaNotCollectionFragment = JSONSchema7 & { $defs?: never };
/**
 * Infers a value type from a JSON schema fragment
 */
export type JSONSchemaFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection> =
  // Model type
  (T extends JSONSchemaModelFragment ? JSONSchemaModelFragmentType<T, TSchemaCollection> : unknown) &
    // Const type
    (T extends JSONSchemaConstFragment ? JSONSchemaConstFragmentType<T> : unknown) &
    // Enum type
    (T extends JSONSchemaEnumFragment ? JSONSchemaEnumFragmentType<T> : unknown) &
    // Primitive type
    (T extends JSONSchemaPrimitiveTypeFragment ? JSONSchemaPrimitiveTypeFragmentType<T> : unknown) &
    // Array type
    (T extends JSONSchemaArrayTypeFragment ? JSONSchemaArrayTypeFragmentType<T, TSchemaCollection> : unknown) &
    // Object type
    (T extends JSONSchemaObjectTypeFragment ? JSONSchemaObjectTypeFragmentType<T, TSchemaCollection> : unknown) &
    // AllOf type
    (T extends JSONSchemaAllOfTypeFragment ? JSONSchemaAllOfTypeFragmentType<T, TSchemaCollection> : unknown) &
    // AnyOf type
    (T extends JSONSchemaAnyOfTypeFragment ? JSONSchemaAnyOfTypeFragmentType<T, TSchemaCollection> : unknown) &
    // OneOf type
    (T extends JSONSchemaOneOfTypeFragment ? JSONSchemaOneOfTypeFragmentType<T, TSchemaCollection> : unknown) &
    // Not type
    (T extends JSONSchemaNotTypeFragment ? JSONSchemaNotTypeFragmentType<T, TSchemaCollection> : unknown) &
    // Reference type
    (T extends JSONSchemaReferenceFragment ? JSONSchemaReferenceFragmentType<T, TSchemaCollection> : unknown);

/**
 * Determines if a JSON schema fragment is a model definition (i.e., an object with `properties`).
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`
 */
export type JSONSchemaFragmentIsModel<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { type: 'object'; properties: infer U }
    ? U extends Record<string, JSONSchema7>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema model definition, which is any object schema fragment containing `properties`.
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`
 */
export type JSONSchemaModelFragment = JSONSchemaNotCollectionFragment & { type: 'object'; properties: Record<string, JSONSchema7> };
/**
 * Infers a value type from a JSON schema model definition
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`
 */
export type JSONSchemaModelFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
  type: 'object';
  properties: infer P extends Record<string, JSONSchema7>;
}
  ? { [key in keyof P]: P[key] extends JSONSchemaNotCollectionFragment ? JSONSchemaFragmentType<P[key], TSchemaCollection> : unknown }
  : unknown;

/**
 * Determines if a JSON schema fragment is a const definition (i.e., contains a `const` property).
 */
export type JSONSchemaFragmentIsConst<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { const: unknown }
    ? true
    : false
  : false;
/**
 * Represents a JSON schema const definition, which is any schema fragment containing a `const` property.
 */
export type JSONSchemaConstFragment = JSONSchemaNotCollectionFragment & { const: unknown };
/**
 * Infers a value type from a SON schema const definition
 */
export type JSONSchemaConstFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { const: infer C } ? C : unknown;

/**
 * Determines if a JSON schema fragment is an enum definition (i.e., contains an `enum` property).
 */
export type JSONSchemaFragmentIsEnum<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { enum: infer U }
    ? U extends Array<unknown> | ReadonlyArray<unknown>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export type JSONSchemaEnumFragment = JSONSchemaNotCollectionFragment & { enum: Array<unknown> | ReadonlyArray<unknown> };
/**
 * Infers a value type from a JSON schema enum definition
 */
export type JSONSchemaEnumFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { enum: infer E extends Array<unknown> | ReadonlyArray<unknown> }
  ? E extends Array<infer U>
    ? U
    : E extends ReadonlyArray<infer U>
      ? U
      : unknown
  : unknown;

/**
 * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property).
 */
export type JSONSchemaFragmentIsPrimitiveType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { type: JSONSchemaPrimitiveTypeName }
    ? true
    : false
  : false;
/**
 * Represents a JSON schema primitive type definition, which is any schema fragment containing a `type` property.
 */
export type JSONSchemaPrimitiveTypeFragment = JSONSchemaNotCollectionFragment & {
  type: JSONSchemaPrimitiveTypeName;
};
/**
 * Infers a value type from a JSON schema primitive type definition
 */
export type JSONSchemaPrimitiveTypeFragmentType<T extends JSONSchemaPrimitiveTypeFragment> = T extends {
  type: infer U extends JSONSchemaPrimitiveTypeName;
}
  ? JSONSchemaPrimitiveTypeFromName<U>
  : never;

/**
 * Determines if a JSON schema fragment is a array type definition (i.e., contains a `type="array"` property and an optional `items` property).
 */
export type JSONSchemaFragmentIsArrayType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { type: 'array' }
    ? T extends { items: infer U }
      ? U extends JSONSchemaNotCollectionFragment
        ? true
        : false
      : true
    : false
  : false;
/**
 * Represents a JSON schema array type definition, which is any schema fragment containing a `type="array"` property and an optional `items` property.
 */
export type JSONSchemaArrayTypeFragment = JSONSchemaNotCollectionFragment & {
  type: 'array';
  items?: JSONSchemaNotCollectionFragment;
};
/**
 * Infers a value type from a JSON schema array type definition
 */
export type JSONSchemaArrayTypeFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
  type: 'array';
}
  ? T extends { items: infer U extends JSONSchemaNotCollectionFragment }
    ? Array<JSONSchemaFragmentType<U, TSchemaCollection>>
    : Array<unknown>
  : never;

/**
 * Determines if a JSON schema fragment is a object type definition (i.e., contains a `type="object"` property and no `properties` property).
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`
 */
export type JSONSchemaFragmentIsObjectType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
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
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`
 */
export type JSONSchemaObjectTypeFragment = JSONSchemaNotCollectionFragment & {
  type: 'object';
  properties?: never;
};
/**
 * Infers a value type from a JSON schema object type definition
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`
 */
export type JSONSchemaObjectTypeFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
  type: 'object';
  properties?: never;
}
  ? object
  : never;

/**
 * Determines if a JSON schema fragment is a all-of-types type definition (i.e., contains a `allOf` property).
 */
export type JSONSchemaFragmentIsAllOfType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { allOf: infer U }
    ? U extends Array<JSONSchemaNotCollectionFragment> | ReadonlyArray<JSONSchemaNotCollectionFragment>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema all-of-types definition, which is any schema fragment containing a `allOf` property.
 */
export type JSONSchemaAllOfTypeFragment = JSONSchemaNotCollectionFragment & {
  allOf: Array<JSONSchemaNotCollectionFragment> | ReadonlyArray<JSONSchemaNotCollectionFragment>;
};
/**
 * Infers a value type from a JSON schema all-of-type definition
 */
export type JSONSchemaAllOfTypeFragmentType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = unknown; //!FIXME: Implement

/**
 * Determines if a JSON schema fragment is a any-of-types type definition (i.e., contains a `anyOf` property).
 */
export type JSONSchemaFragmentIsAnyOfType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { anyOf: infer U }
    ? U extends Array<JSONSchemaNotCollectionFragment> | ReadonlyArray<JSONSchemaNotCollectionFragment>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema any-of-types definition, which is any schema fragment containing a `anyOf` property.
 */
export type JSONSchemaAnyOfTypeFragment = JSONSchemaNotCollectionFragment & {
  anyOf: Array<JSONSchemaNotCollectionFragment> | ReadonlyArray<JSONSchemaNotCollectionFragment>;
};
/**
 * Infers a value type from a JSON schema any-of-type definition
 */
export type JSONSchemaAnyOfTypeFragmentType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = unknown; //!FIXME: Implement

/**
 * Determines if a JSON schema fragment is a one-of-types type definition (i.e., contains a `oneOf` property).
 */
export type JSONSchemaFragmentIsOneOfType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { oneOf: infer U }
    ? U extends Array<JSONSchemaNotCollectionFragment> | ReadonlyArray<JSONSchemaNotCollectionFragment>
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema one-of-types definition, which is any schema fragment containing a `oneOf` property.
 */
export type JSONSchemaOneOfTypeFragment = JSONSchemaNotCollectionFragment & {
  oneOf: Array<JSONSchemaNotCollectionFragment> | ReadonlyArray<JSONSchemaNotCollectionFragment>;
};
/**
 * Infers a value type from a JSON schema one-of-type definition
 */
export type JSONSchemaOneOfTypeFragmentType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = unknown; //!FIXME: Implement

/**
 * Determines if a JSON schema fragment is a not-types type definition (i.e., contains a `not` property).
 */
export type JSONSchemaFragmentIsNotType<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { not: infer U }
    ? U extends JSONSchemaNotCollectionFragment
      ? true
      : false
    : false
  : false;
/**
 * Represents a JSON schema not-types definition, which is any schema fragment containing a `not` property.
 */
export type JSONSchemaNotTypeFragment = JSONSchemaNotCollectionFragment & {
  not: JSONSchemaNotCollectionFragment;
};
/**
 * Infers a value type from a JSON schema not-type definition
 */
export type JSONSchemaNotTypeFragmentType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = unknown; //!FIXME: Implement

/**
 * Determines if a JSON schema fragment is a reference definition (i.e., contains a `$ref` property).
 */
export type JSONSchemaFragmentIsReference<T extends JSONSchema7> = T extends JSONSchemaNotCollectionFragment
  ? T extends { $ref: string }
    ? true
    : false
  : false;
/**
 * Represents a JSON schema reference definition, which is any schema fragment containing a `$ref` property.
 */
export type JSONSchemaReferenceFragment = JSONSchemaNotCollectionFragment & {
  $ref: string;
};
/**
 * Infers a value type from a JSON schema reference definition
 */
export type JSONSchemaReferenceFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection> = T extends {
  $ref: infer P extends string;
}
  ? P extends `#/$defs/${infer N}`
    ? N extends keyof TSchemaCollection['$defs']
      ? TSchemaCollection['$defs'][N] extends infer M extends JSONSchemaNotCollectionFragment
        ? JSONSchemaFragmentType<M, TSchemaCollection>
        : unknown
      : unknown
    : unknown
  : unknown;
