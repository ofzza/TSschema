/**
 * Typescript utilities for JSON schema `oneOf` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

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
 * Infers a value type from a JSON schema one-of-types definition, as the union of all the listed fragments' types. A value valid against exactly one of
 * the fragments can not be told apart from one valid against several of them by a type, so this over-approximates `oneOf` just as `anyOf` is inferred.
 * An empty `oneOf` can never be satisfied and infers `never`.
 */
export type JSONSchemaOneOfTypeFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends { oneOf: infer U extends ReadonlyArray<JSONSchemaNotCollectionFragment> } ? JSONSchemaFragmentType<U[number], TSchemaCollection> : unknown;
