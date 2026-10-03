/**
 * Typescript utilities for JSON schema `anyOf` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

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
