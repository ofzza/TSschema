/**
 * Typescript utilities for JSON schema `type: "array"` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

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
