/**
 * Typescript utilities for type inference from a JSON schema
 */

import type { JSONSchemaCollection } from './JSONSchema.js';

/**
 * Provides the type for the name of a JSON schema fragment from within the JSON schema collection
 */
export type _TSSchemaFragmentName<T extends JSONSchemaCollection = JSONSchemaCollection> = keyof T['$defs'];

/**
 * Wrapper type for a JSON schema collection, allowing type inference from the schema itself.
 */
export type JSONSchemaCollectionWrapper<T extends JSONSchemaCollection = JSONSchemaCollection> = {
  __collection: T;
};
/**
 * Unwraps a JSON schema collection wrapper to obtain the original JSON schema collection type.
 */
export type UnwrapJSONSchemaCollectionWrapper<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper> = T extends JSONSchemaCollectionWrapper
  ? T['__collection']
  : T;

/**
 * Provides the type for the name of a JSON schema fragment from within the JSON schema collection or JSON schema collection wrapper
 */
export type TSSchemaFragmentName<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper = JSONSchemaCollection> =
  UnwrapJSONSchemaCollectionWrapper<T> extends infer U extends JSONSchemaCollection ? keyof U['$defs'] : string | number;

/**
 * Provides a type-safe wrapper around a JSON schema for TypeScript type inference.
 */
export type TSSchemaCollection<T extends JSONSchemaCollection = JSONSchemaCollection> = JSONSchemaCollectionWrapper<T>; // Wrap schema
