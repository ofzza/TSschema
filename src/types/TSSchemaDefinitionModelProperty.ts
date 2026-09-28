/**
 * Typescript utilities for type inference from a JSON schema model property definitions
 */

import type { JSONSchema7 } from './JSONSchema';
import type { JSONSchemaDefinitionModelWrapper, UnwrapJSONSchemaDefinitionModelWrapper } from './TSSchemaDefinitionModel';

/**
 * Provides the type for the name of a JSON schema definition model property from within the JSON schema
 */
export type TSSchemaDefinitionModelPropertyName<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionModelWrapper = JSONSchema7> =
  UnwrapJSONSchemaDefinitionModelWrapper<TJSONSchema>['properties'] extends infer T ? (T extends Record<PropertyKey, unknown> ? keyof T : PropertyKey) : never;

/**
 * Wrapper type for a JSON schema model property, allowing type inference from the schema itself.
 */
export type JSONSchemaDefinitionModelPropertyWrapper<TJSONSchema extends JSONSchema7 = JSONSchema7> = {
  __property: TJSONSchema;
};
/**
 * Unwraps a JSON schema model property wrapper to obtain the original JSON schema model property type.
 */
export type UnwrapJSONSchemaDefinitionModelPropertyWrapper<TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionModelPropertyWrapper> =
  TJSONSchema extends JSONSchemaDefinitionModelPropertyWrapper<infer T> ? T : TJSONSchema;

/**
 * Provides a type-safe wrapper around a JSON schema definition model property for TypeScript type inference.
 */
export type TSSchemaDefinitionModelProperty<
  TJSONSchema extends JSONSchema7 | JSONSchemaDefinitionModelWrapper,
  TName extends TSSchemaDefinitionModelPropertyName<TJSONSchema> | undefined = undefined,
> =
  UnwrapJSONSchemaDefinitionModelWrapper<TJSONSchema> extends infer T
    ? T extends { properties: Record<PropertyKey, unknown> }
      ? TName extends undefined
        ? never // If provided JSON schema, definition name is mandatory
        : TName extends keyof T['properties']
          ? T['properties'][TName] extends JSONSchema7
            ? JSONSchemaDefinitionModelPropertyWrapper<T['properties'][TName]>
            : never
          : never
      : never // Provided JSON schema must contain properties
    : never;
