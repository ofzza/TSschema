/**
 * Typescript utilities for type inference from a JSON schema
 */

import type { JSONSchema7 } from './JSONSchema';

/**
 * Wrapper type for a JSON schema, allowing type inference from the schema itself.
 */
export type JSONSchemaWrapper<TJSONSchema extends JSONSchema7 = JSONSchema7> = {
  __schema: TJSONSchema;
};
/**
 * Unwraps a JSON schema wrapper to obtain the original JSON schema type.
 */
export type UnwrapJSONSchemaWrapper<TJSONSchema extends JSONSchema7 | JSONSchemaWrapper> =
  TJSONSchema extends JSONSchemaWrapper<JSONSchema7> ? TJSONSchema['__schema'] : TJSONSchema;

/**
 * Provides a type-safe wrapper around a JSON schema for TypeScript type inference.
 */
export type TSSchema<TJSONSchema extends JSONSchema7 | undefined = undefined> = JSONSchemaWrapper<TJSONSchema extends undefined ? JSONSchema7 : TJSONSchema>;
