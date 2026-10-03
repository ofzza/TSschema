/**
 * Typescript utilities for JSON schema `not` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

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
