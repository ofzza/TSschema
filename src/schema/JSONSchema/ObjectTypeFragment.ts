/**
 * Typescript utilities for JSON schema `type: "object"` fragments without `properties`: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

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
