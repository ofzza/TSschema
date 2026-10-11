/**
 * Typescript utilities for JSON schema model fragments (`type: "object"` with `properties`): detection, property names and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

/**
 * Represents a JSON schema model definition, which is any object schema fragment containing `properties`.
 * TODO: Support `boolean schemas (valid JSON schema)`, `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `readOnly`. `writeOnly`
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
 * Infers a value type from a JSON schema model definition. A property listed in the model's `required` keyword is inferred as required, and any other
 * property as optional (`key?:`), so a model with no `required`, or with a `required` which is not a list of literal names (e.g. a widened `string[]`),
 * infers every property as optional. Required names the model does not define are ignored. Every property is inferred as mutable, and its optionality
 * comes only from `required`, regardless of any `readonly` or `?` modifiers the schema's own `properties` object was declared with (e.g. the `readonly`
 * that `as const` adds to every key).
 * TODO: Support `boolean schemas (valid JSON schema)`, `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`, `readOnly`. `writeOnly`
 */
export type JSONSchemaModelFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
  type: 'object';
  properties: infer P extends Record<string, JSONSchema7>;
}
  ? // Homomorphic mapped types: replace the `readonly` / `?` modifiers they would otherwise copy from the schema literal, making required properties
    // required and all other properties optional, then flatten their intersection into a single object type
    _JSONSchemaModelFragmentFlatten<
      {
        -readonly [key in keyof P as key extends _JSONSchemaModelFragmentRequiredName<T> ? key : never]-?: _JSONSchemaModelFragmentPropertyType<
          P[key],
          TSchemaCollection
        >;
      } & {
        -readonly [key in keyof P as key extends _JSONSchemaModelFragmentRequiredName<T> ? never : key]+?: _JSONSchemaModelFragmentPropertyType<
          P[key],
          TSchemaCollection
        >;
      }
    >
  : unknown;
/**
 * Gets the names of a JSON schema model definition's required properties, as listed by its `required` keyword. A model with no `required`, or with a
 * `required` which is not a list of literal names, infers `never`.
 */
type _JSONSchemaModelFragmentRequiredName<T> =
  // Required property names listed
  T extends { required: infer R extends ReadonlyArray<unknown> }
    ? // Not a list of literal names: no name is known to be required
      string extends R[number]
      ? never
      : R[number]
    : // No required property names
      never;
/**
 * Infers the value type of a single model property from its schema, stripping the `undefined` an optional key adds to its schema, so that it does not
 * fail the fragment check
 */
type _JSONSchemaModelFragmentPropertyType<TProperty, TSchemaCollection extends JSONSchemaCollection> =
  Exclude<TProperty, undefined> extends infer F extends JSONSchemaNotCollectionFragment ? JSONSchemaFragmentType<F, TSchemaCollection> : unknown;
/**
 * Flattens an intersection of object types into a single object type, keeping each property's modifiers
 */
type _JSONSchemaModelFragmentFlatten<T> = { [K in keyof T]: T[K] };
