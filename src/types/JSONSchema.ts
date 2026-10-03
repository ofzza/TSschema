/**
 * Typescript utilities for inferring value types from JSON schema fragments.
 *
 * Builds on an override of the JSON Schema Draft 7 type which makes every property optionally read-only, so that schemas can be referenced as `as const`
 * constants and keep their literal types for inference.
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
 * Gets the names of all fragments defined in a JSON schema collection's `$defs`. The default, unspecified collection infers `string | number`.
 */
export type JSONSchemaFragmentName<T extends JSONSchemaCollection = JSONSchemaCollection> = keyof T['$defs'];
/**
 * Determines if a JSON schema fragment is a definition (i.e., not a collection).
 */
export type JSONSchemaFragmentIsNotCollection<T extends JSONSchema7> = JSONSchemaFragmentIsCollection<T> extends true ? false : true;
/**
 * Represents a JSON schema definition, which is any schema fragment that is not a collection.
 */
export type JSONSchemaNotCollectionFragment = JSONSchema7 & { $defs?: never };

/**
 * Infers a value type from a JSON schema fragment.
 *
 * Every keyword the fragment carries contributes a type and all of them are intersected, so sibling keywords narrow each other (e.g. `type` + `enum`),
 * conflicting keywords resolve to `never` and a `$ref` is intersected with its siblings (as in JSON schema 2019-09 and later). A keyword that is not
 * (yet) supported contributes `unknown`, i.e. no constraint. A union of fragments infers the union of each fragment's type.
 */
export type JSONSchemaFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection> =
  // Distribute over a union of fragments up front, so that a branch matching only some union members can not collapse the result to `unknown`
  T extends unknown ? _JSONSchemaFragmentType<T, TSchemaCollection> : never;
/**
 * Infers a value type from a single (non-union) JSON schema fragment, by intersecting the types contributed by each keyword
 */
type _JSONSchemaFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection> =
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
 * Represents a JSON schema model definition, which is any object schema fragment containing `properties`.
 * TODO: Support `type` arrays of primitive types: example `["object", "string"]`
 * TODO: Support `boolean schemas (valid JSON schema)`, `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`, `readOnly`. `writeOnly`
 */
export type JSONSchemaModelFragment = JSONSchemaNotCollectionFragment & { type: 'object'; properties: Record<string, JSONSchema7> };
/**
 * Determines if a JSON schema fragment is a model definition (i.e., an object with `properties`).
 */
export type JSONSchemaFragmentIsModel<T extends JSONSchema7> = T extends JSONSchemaModelFragment ? true : false;
/**
 * Gets the names of all properties defined in a JSON schema model definition's `properties`. The default, unspecified model infers `string | number`.
 */
export type JSONSchemaFragmentPropertyName<T extends JSONSchemaModelFragment = JSONSchemaModelFragment> = keyof T['properties'];
/**
 * Infers a value type from a JSON schema model definition. Every property is inferred as required and mutable, regardless of any `readonly` or `?`
 * modifiers the schema's own `properties` object was declared with (e.g. the `readonly` that `as const` adds to every key).
 * TODO: Support `type` arrays of primitive types: example `["object", "string"]`
 * TODO: Support `boolean schemas (valid JSON schema)`, `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`, `readOnly`. `writeOnly`
 */
export type JSONSchemaModelFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
  type: 'object';
  properties: infer P extends Record<string, JSONSchema7>;
}
  ? // Homomorphic mapped type: strip the `readonly` / `?` modifiers it would otherwise copy from the schema literal, and the `undefined` an optional key
    // adds to its schema, so that it does not fail the fragment check below
    {
      -readonly [key in keyof P]-?: Exclude<P[key], undefined> extends infer F extends JSONSchemaNotCollectionFragment
        ? JSONSchemaFragmentType<F, TSchemaCollection>
        : unknown;
    }
  : unknown;

/**
 * Represents a JSON schema const definition, which is any schema fragment containing a `const` property.
 */
export type JSONSchemaConstFragment = JSONSchemaNotCollectionFragment & { const: unknown };
/**
 * Determines if a JSON schema fragment is a const definition (i.e., contains a `const` property).
 */
export type JSONSchemaFragmentIsConst<T extends JSONSchema7> = T extends JSONSchemaConstFragment ? true : false;
/**
 * Infers a value type from a JSON schema const definition
 */
export type JSONSchemaConstFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { const: infer C } ? C : unknown;

/**
 * Represents a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export type JSONSchemaEnumFragment = JSONSchemaNotCollectionFragment & { enum: ReadonlyArray<unknown> };
/**
 * Determines if a JSON schema fragment is an enum definition (i.e., contains an `enum` property).
 */
export type JSONSchemaFragmentIsEnum<T extends JSONSchema7> = T extends JSONSchemaEnumFragment ? true : false;
/**
 * Infers a value type from a JSON schema enum definition, as the union of all enumerated values
 */
export type JSONSchemaEnumFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { enum: infer E extends ReadonlyArray<unknown> }
  ? E[number]
  : unknown;

/**
 * Represents a JSON schema primitive type definition, which is any schema fragment containing a `type` property naming a primitive type, or an array of
 * primitive type names.
 * TODO: Support `type` arrays of primitive types: example `["number", "string"]`
 */
export type JSONSchemaPrimitiveTypeFragment = JSONSchemaNotCollectionFragment & {
  type: JSONSchemaPrimitiveTypeName | ReadonlyArray<JSONSchemaPrimitiveTypeName>;
};
/**
 * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property naming a primitive type, or an array of primitive
 * type names).
 */
export type JSONSchemaFragmentIsPrimitiveType<T extends JSONSchema7> = T extends JSONSchemaPrimitiveTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema primitive type definition. An array of type names infers the union of their types.
 */
export type JSONSchemaPrimitiveTypeFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends {
  type: infer U extends JSONSchemaPrimitiveTypeName | ReadonlyArray<JSONSchemaPrimitiveTypeName>;
}
  ? U extends ReadonlyArray<JSONSchemaPrimitiveTypeName>
    ? JSONSchemaPrimitiveTypeFromName<U[number]>
    : U extends JSONSchemaPrimitiveTypeName
      ? JSONSchemaPrimitiveTypeFromName<U>
      : unknown
  : unknown;

/**
 * Represents a JSON schema array type definition, which is any schema fragment containing a `type="array"` property and an optional `items` property.
 * TODO: Support `type` arrays of primitive types: example `["array", "string"]`
 */
export type JSONSchemaArrayTypeFragment = JSONSchemaNotCollectionFragment & {
  type: 'array';
  items?: JSONSchemaNotCollectionFragment;
};
/**
 * Determines if a JSON schema fragment is an array type definition (i.e., contains a `type="array"` property and an optional `items` property).
 */
export type JSONSchemaFragmentIsArrayType<T extends JSONSchema7> = T extends JSONSchemaArrayTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema array type definition. An array with no (single schema) `items` infers `Array<unknown>`.
 * TODO: Support tuple `items` / `prefixItems`
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
  : unknown;

/**
 * Represents a JSON schema object type definition, which is any schema fragment containing a `type="object"` property and no `properties` property.
 * TODO: Support `type` arrays of primitive types: example `["object", "string"]`
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`, `readOnly`. `writeOnly`
 */
export type JSONSchemaObjectTypeFragment = JSONSchemaNotCollectionFragment & {
  type: 'object';
  properties?: never;
};
/**
 * Determines if a JSON schema fragment is an object type definition (i.e., contains a `type="object"` property and no `properties` property).
 */
export type JSONSchemaFragmentIsObjectType<T extends JSONSchema7> = T extends JSONSchemaObjectTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema object type definition
 * TODO: Support `type` arrays of primitive types: example `["object", "string"]`
 * TODO: Support `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `required`, `readOnly`. `writeOnly`
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
  : unknown;

/**
 * Represents a JSON schema all-of-types definition, which is any schema fragment containing an `allOf` property.
 */
export type JSONSchemaAllOfTypeFragment = JSONSchemaNotCollectionFragment & {
  allOf: ReadonlyArray<JSONSchemaNotCollectionFragment>;
};
/**
 * Determines if a JSON schema fragment is an all-of-types definition (i.e., contains an `allOf` property).
 */
export type JSONSchemaFragmentIsAllOfType<T extends JSONSchema7> = T extends JSONSchemaAllOfTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema all-of-types definition, as the intersection of all the listed fragments' types. An empty `allOf` places no
 * constraint and infers `unknown`.
 */
export type JSONSchemaAllOfTypeFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends { allOf: infer U extends ReadonlyArray<JSONSchemaNotCollectionFragment> } ? _JSONSchemaAllOfTypeFragmentType<U, TSchemaCollection> : unknown;
/**
 * Intersects the inferred types of all fragments in an `allOf` array. A tuple is intersected element by element; a plain (non-tuple) array, whose
 * elements are not known individually, infers the type of its element type.
 */
type _JSONSchemaAllOfTypeFragmentType<
  T extends ReadonlyArray<JSONSchemaNotCollectionFragment>,
  TSchemaCollection extends JSONSchemaCollection,
> = T extends readonly [infer H extends JSONSchemaNotCollectionFragment, ...infer R extends ReadonlyArray<JSONSchemaNotCollectionFragment>]
  ? JSONSchemaFragmentType<H, TSchemaCollection> & _JSONSchemaAllOfTypeFragmentType<R, TSchemaCollection>
  : T extends readonly []
    ? unknown
    : JSONSchemaFragmentType<T[number], TSchemaCollection>;

/**
 * Represents a JSON schema any-of-types definition, which is any schema fragment containing an `anyOf` property.
 */
export type JSONSchemaAnyOfTypeFragment = JSONSchemaNotCollectionFragment & {
  anyOf: ReadonlyArray<JSONSchemaNotCollectionFragment>;
};
/**
 * Determines if a JSON schema fragment is an any-of-types definition (i.e., contains an `anyOf` property).
 */
export type JSONSchemaFragmentIsAnyOfType<T extends JSONSchema7> = T extends JSONSchemaAnyOfTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema any-of-types definition, as the union of all the listed fragments' types. An empty `anyOf` can never be
 * satisfied and infers `never`.
 */
export type JSONSchemaAnyOfTypeFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends { anyOf: infer U extends ReadonlyArray<JSONSchemaNotCollectionFragment> } ? JSONSchemaFragmentType<U[number], TSchemaCollection> : unknown;

/**
 * Represents a JSON schema one-of-types definition, which is any schema fragment containing a `oneOf` property.
 */
export type JSONSchemaOneOfTypeFragment = JSONSchemaNotCollectionFragment & {
  oneOf: ReadonlyArray<JSONSchemaNotCollectionFragment>;
};
/**
 * Determines if a JSON schema fragment is a one-of-types definition (i.e., contains a `oneOf` property).
 */
export type JSONSchemaFragmentIsOneOfType<T extends JSONSchema7> = T extends JSONSchemaOneOfTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema one-of-types definition. Not yet supported, so places no constraint and infers `unknown`.
 */
export type JSONSchemaOneOfTypeFragmentType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = unknown; // TODO: Implement support for One-Of

/**
 * Represents a JSON schema not-type definition, which is any schema fragment containing a `not` property.
 */
export type JSONSchemaNotTypeFragment = JSONSchemaNotCollectionFragment & {
  not: JSONSchemaNotCollectionFragment;
};
/**
 * Determines if a JSON schema fragment is a not-type definition (i.e., contains a `not` property).
 */
export type JSONSchemaFragmentIsNotType<T extends JSONSchema7> = T extends JSONSchemaNotTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema not-type definition. Not yet supported, so places no constraint and infers `unknown`.
 */
export type JSONSchemaNotTypeFragmentType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends JSONSchemaNotCollectionFragment,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = unknown; // TODO: Implement support for Not

/**
 * Represents a JSON schema reference definition, which is any schema fragment containing a `$ref` property.
 */
export type JSONSchemaReferenceFragment = JSONSchemaNotCollectionFragment & {
  $ref: string;
};
/**
 * Determines if a JSON schema fragment is a reference definition (i.e., contains a `$ref` property).
 */
export type JSONSchemaFragmentIsReference<T extends JSONSchema7> = T extends JSONSchemaReferenceFragment ? true : false;
/**
 * Infers a value type from a JSON schema reference definition, by resolving a `#/$defs/<name>` reference against the given schema collection. Any other
 * reference, or a reference to a definition missing from the collection, places no constraint and infers `unknown`.
 */
export type JSONSchemaReferenceFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
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
