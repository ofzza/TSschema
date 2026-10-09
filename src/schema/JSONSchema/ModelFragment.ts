/**
 * Typescript utilities for JSON schema model fragments (`type: "object"` with `properties`): detection, property names and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

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
