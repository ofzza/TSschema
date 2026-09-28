/**
 * Typescript utilities for type inference from a JSON schema value definitions
 */

import type { JSONSchema7 } from './JSONSchema';
import { TSSchemaDefinitionIsEnum } from './TSSchemaDefinitionEnum';
import { TSSchemaDefinitionIsModel } from './TSSchemaDefinitionModel';

/**
 * Determines if a given JSON schema definition represents a value. Returns `true` if it is a value, `false` otherwise.
 */
export type TSSchemaDefinitionIsValue<TSchemaDefinition extends JSONSchema7> =
  TSSchemaDefinitionIsEnum<TSchemaDefinition> extends true ? false : TSSchemaDefinitionIsModel<TSchemaDefinition> extends true ? false : true;

/**
 * Wrapper type for a JSON schema value, allowing type inference from the schema itself.
 */
export type JSONSchemaDefinitionValueWrapper<TJSONSchema extends JSONSchema7 = JSONSchema7> = {
  __value: TJSONSchema;
};
/**
 * Unwraps a JSON schema enum wrapper to obtain the original JSON schema enum type.
 */
export type UnwrapJSONSchemaDefinitionValueWrapper<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionValueWrapper> =
  TJSONSchema extends JSONSchemaDefinitionValueWrapper<infer T> ? T : TJSONSchema;

/**
 * Infers value type from JSON schema value wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaDefinitionValueType<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionValueWrapper> = never; // FIXME: Implement type inference
