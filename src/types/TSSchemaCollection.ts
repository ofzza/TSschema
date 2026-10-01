/**
 * Typescript utilities for type inference from a JSON schema
 */

import type { JSONSchemaFragmentCollection } from './JSONSchema';

/**
 * Provides the type for the name of a JSON schema definition from within the JSON schema
 */
export type TSSchemaName<T extends JSONSchemaFragmentCollection | JSONSchemaCollectionWrapper = JSONSchemaFragmentCollection> =
  UnwrapJSONSchemaCollectionWrapper<T> extends infer U extends JSONSchemaFragmentCollection ? keyof U['$defs'] : string | number;

/**
 * Wrapper type for a JSON schema collection, allowing type inference from the schema itself.
 */
export type JSONSchemaCollectionWrapper<T extends JSONSchemaFragmentCollection = JSONSchemaFragmentCollection> = {
  __collection: T;
};
/**
 * Unwraps a JSON schema collection wrapper to obtain the original JSON schema collection type.
 */
export type UnwrapJSONSchemaCollectionWrapper<T extends JSONSchemaFragmentCollection | JSONSchemaCollectionWrapper> =
  T extends JSONSchemaCollectionWrapper<JSONSchemaFragmentCollection> ? T['__collection'] : T;

/**
 * Provides a type-safe wrapper around a JSON schema for TypeScript type inference.
 */
export type TSSchemaCollection<T extends JSONSchemaFragmentCollection = JSONSchemaFragmentCollection> = JSONSchemaCollectionWrapper<T>; // Wrap schema
