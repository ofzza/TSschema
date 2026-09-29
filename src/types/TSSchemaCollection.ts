/**
 * Typescript utilities for type inference from a JSON schema
 */

import type { JSONSchemaCollection } from './JSONSchema';

/**
 * Provides the type for the name of a JSON schema definition from within the JSON schema
 */
export type TSSchemaName<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper = JSONSchemaCollection> =
  UnwrapJSONSchemaCollectionWrapper<T> extends infer U extends JSONSchemaCollection ? keyof U['$defs'] : string | number;

/**
 * Wrapper type for a JSON schema collection, allowing type inference from the schema itself.
 */
export type JSONSchemaCollectionWrapper<T extends JSONSchemaCollection = JSONSchemaCollection> = {
  __collection: T;
};
/**
 * Unwraps a JSON schema collection wrapper to obtain the original JSON schema collection type.
 */
export type UnwrapJSONSchemaCollectionWrapper<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper> =
  T extends JSONSchemaCollectionWrapper<JSONSchemaCollection> ? T['__collection'] : T;

/**
 * Provides a type-safe wrapper around a JSON schema for TypeScript type inference.
 */
export type TSSchemaCollection<T extends JSONSchemaCollection = JSONSchemaCollection> = JSONSchemaCollectionWrapper<T>; // Wrap schema
