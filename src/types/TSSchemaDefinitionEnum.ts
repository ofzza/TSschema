/**
 * Typescript utilities for type inference from a JSON schema enum definitions
 */

import type { JSONSchema7 } from './JSONSchema';

/**
 * Determines if a given JSON schema definition represents an enum. Returns `true` if it is an enum, `false` otherwise.
 */
export type TSSchemaDefinitionIsEnum<TSchemaDefinition extends JSONSchema7> = TSchemaDefinition extends { enum: unknown } ? true : false;

/**
 * Wrapper type for a JSON schema enum, allowing type inference from the schema itself.
 */
export type JSONSchemaDefinitionEnumWrapper<TJSONSchema extends JSONSchema7 = JSONSchema7> = {
  __enum: TJSONSchema;
};
/**
 * Unwraps a JSON schema enum wrapper to obtain the original JSON schema enum type.
 */
export type UnwrapJSONSchemaDefinitionEnumWrapper<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionEnumWrapper> =
  TJSONSchema extends JSONSchemaDefinitionEnumWrapper<infer T> ? T : TJSONSchema;

/**
 * Infers enum type from JSON schema enum wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaDefinitionEnumType<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionEnumWrapper> = never; // FIXME: Implement type inference
