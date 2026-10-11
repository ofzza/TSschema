/**
 * Typescript utilities for JSON schema `type: "null"` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

/**
 * Represents a JSON schema null type definition, which is any schema fragment containing a `type="null"` property.
 */
export type JSONSchemaNullTypeFragment = JSONSchemaNotCollectionFragment & {
  type: 'null';
};
/**
 * Determines if a JSON schema fragment is a null type definition (i.e., contains a `type="null"` property).
 */
export type JSONSchemaFragmentIsNullType<T extends JSONSchema7> = T extends JSONSchemaNullTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema null type definition
 */
export type JSONSchemaNullTypeFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { type: 'null' } ? null : unknown;
