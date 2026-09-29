/**
 * Typescript utilities for type inference from a JSON schema definitions
 */

// FIXME: Append enum handling on top of Value and Model schemas

import type { JSONSchemaCollection, JSONSchemaNotCollection } from './JSONSchema';
import type { JSONSchemaCollectionWrapper, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection';
import { TSSchemaName } from './TSSchemaCollection';

/**
 * Wrapper type for a JSON schema definition, allowing type inference from the schema itself.
 */
export type JSONSchemaWrapper<T extends JSONSchemaNotCollection = JSONSchemaNotCollection, TCollection extends JSONSchemaCollection = JSONSchemaCollection> = {
  __definition: T;
  __collection: TCollection;
};
/**
 * Unwraps a JSON schema definition wrapper to obtain the original JSON schema definition type.
 */
export type UnwrapJSONSchemaWrapper<T extends JSONSchemaNotCollection | JSONSchemaWrapper> =
  T extends JSONSchemaWrapper<JSONSchemaNotCollection> ? T['__definition'] : T;

/**
 * Provides a type-safe wrapper around a JSON schema definition for TypeScript type inference.
 */
export type TSSchema<
  T extends JSONSchemaNotCollection | JSONSchemaCollection | JSONSchemaCollectionWrapper,
  TName extends (T extends JSONSchemaCollection ? TSSchemaName<T> : never) = never,
> = T extends
  JSONSchemaCollection | JSONSchemaCollectionWrapper // If T is a JSON schema collection or a JSON definition collection wrapper
  ? UnwrapJSONSchemaCollectionWrapper<T> extends infer U extends JSONSchemaCollection // Unwrap JSON schema collection
    ? TName extends keyof U['$defs']
      ? U['$defs'][TName] extends infer V extends JSONSchemaNotCollection // Check if requested model exists on schema collection
        ? JSONSchemaWrapper<V, U>
        : JSONSchemaWrapper // Fall through to default JSON schema definition
      : JSONSchemaWrapper
    : T extends JSONSchemaNotCollection // Fall through to wrapping schema as given
      ? JSONSchemaWrapper<T>
      : JSONSchemaWrapper
  : T extends JSONSchemaNotCollection // Fall through to wrapping schema as given
    ? JSONSchemaWrapper<T>
    : JSONSchemaWrapper;

/**
 * Infers enum type from JSON schema enum wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaType<T extends JSONSchemaNotCollection | JSONSchemaWrapper> = never; // FIXME: Implement type inference
