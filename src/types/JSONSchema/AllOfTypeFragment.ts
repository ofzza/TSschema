/**
 * Typescript utilities for JSON schema `allOf` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

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
