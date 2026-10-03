/**
 * Typescript utilities for JSON schema `$ref` fragments: detection and value type inference, resolving references against a JSON schema collection.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaFragmentType } from './Fragment.js';

/**
 * Represents a JSON schema reference definition, which is any schema fragment containing a `$ref` property.
 */
export type JSONSchemaReferenceFragment = JSONSchemaNotCollectionFragment & {
  $ref: string;
};
/**
 * Determines if a JSON schema fragment is a reference definition (i.e., contains a `$ref` property).
 */
export type JSONSchemaFragmentIsReference<T extends JSONSchema7> = T extends JSONSchemaReferenceFragment ? true : false;
/**
 * Infers a value type from a JSON schema reference definition, by resolving a `#/$defs/<name>` reference against the given schema collection. Any other
 * reference, or a reference to a definition missing from the collection, places no constraint and infers `unknown`.
 */
export type JSONSchemaReferenceFragmentType<
  T extends JSONSchemaNotCollectionFragment,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> = T extends {
  $ref: infer P extends string;
}
  ? P extends `#/$defs/${infer N}`
    ? N extends keyof TSchemaCollection['$defs']
      ? TSchemaCollection['$defs'][N] extends infer M extends JSONSchemaNotCollectionFragment
        ? JSONSchemaFragmentType<M, TSchemaCollection>
        : unknown
      : unknown
    : unknown
  : unknown;
