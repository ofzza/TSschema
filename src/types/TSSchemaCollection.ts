/**
 * Typescript utilities for wrapping a JSON schema collection (a schema with `$defs`).
 *
 * A wrapped collection is the context every other wrapper carries along: fragments addressed by name from it remember the collection they came from, so
 * that any `$ref` between fragments of the collection can later be resolved when inferring their value types.
 */

import type { JSONSchemaCollection, JSONSchemaFragmentName } from './JSONSchema.js';

/**
 * Wrapper type for a JSON schema collection, holding on to the collection as `__collection`.
 *
 * Every other wrapper (fragment and model property) extends this one, so any wrapper is structurally also a collection wrapper of its parent collection.
 */
export type JSONSchemaCollectionWrapper<T extends JSONSchemaCollection = JSONSchemaCollection> = {
  __collection: T;
};
/**
 * Unwraps a JSON schema collection wrapper, or any other wrapper, to obtain the wrapped JSON schema collection. A collection that is not wrapped is returned
 * as is.
 */
export type UnwrapJSONSchemaCollectionWrapper<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper> = T extends JSONSchemaCollectionWrapper
  ? T['__collection']
  : T;

/**
 * Gets the names of all fragments defined in a JSON schema collection or a JSON schema collection wrapper. As every wrapper is also a collection wrapper,
 * a fragment or model property wrapper infers the fragment names of its parent collection. The default, unspecified collection infers `string | number`.
 */
export type TSSchemaFragmentName<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper = JSONSchemaCollection> =
  UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection ? JSONSchemaFragmentName<C> : JSONSchemaFragmentName;

/**
 * Wraps a JSON schema collection, so that its fragments can be addressed by name and their value types inferred with every `$ref` between them resolved.
 */
export type TSSchemaCollection<T extends JSONSchemaCollection = JSONSchemaCollection> = JSONSchemaCollectionWrapper<T>;
