/**
 * Typescript utilities for JSON schema `oneOf` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

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
