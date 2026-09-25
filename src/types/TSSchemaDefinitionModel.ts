/**
 * Typescript utilities for type inference from a JSON schema
 */

import type { JSONSchema7 } from './JSONSchema';

/**
 * Determines if a given JSON schema definition represents a model. Returns `true` if it is a model, `false` otherwise.
 */
export type TSSchemaDefinitionIsModel<TSchemaDefinition extends JSONSchema7> = TSchemaDefinition extends { properties: unknown } ? true : false;

/**
 * Wrapper type for a JSON schema model, allowing type inference from the schema itself.
 */
export type JSONSchemaDefinitionModelWrapper<TJSONSchema extends JSONSchema7 = JSONSchema7> = {
  __model: TJSONSchema;
};
/**
 * Unwraps a JSON schema model wrapper to obtain the original JSON schema model type.
 */
export type UnwrapJSONSchemaDefinitionModelWrapper<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionModelWrapper> =
  TJSONSchema extends JSONSchemaDefinitionModelWrapper<infer T> ? T : TJSONSchema;
