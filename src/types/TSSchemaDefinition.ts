/**
 * Typescript utilities for type inference from a JSON schema
 */

import type { JSONSchema7 } from './JSONSchema';
import type { JSONSchemaWrapper, UnwrapJSONSchemaWrapper } from './TSSchema';
import type { TSSchemaDefinitionIsEnum, JSONSchemaDefinitionEnumWrapper } from './TSSchemaDefinitionEnum';
import type { TSSchemaDefinitionIsModel, JSONSchemaDefinitionModelWrapper } from './TSSchemaDefinitionModel';

/**
 * Provides the type for the name of a JSON schema definition from within the JSON schema
 */
export type TSSchemaDefinitionName<TJSONSchema extends JSONSchema7 | JSONSchemaWrapper = JSONSchema7> =
  UnwrapJSONSchemaWrapper<TJSONSchema>['$defs'] extends infer T ? (T extends Record<PropertyKey, unknown> ? keyof T : PropertyKey) : never;

/**
 * Provides a type-safe wrapper around a JSON schema definition for TypeScript type inference.
 */
export type TSSchemaDefinition<TJSONSchema extends JSONSchema7 | JSONSchemaWrapper, TName extends TSSchemaDefinitionName<TJSONSchema> | undefined = undefined> =
  UnwrapJSONSchemaWrapper<TJSONSchema> extends infer T // Unwrap JSON schema definition
    ? T extends { $defs: Record<PropertyKey, unknown> } // If provided JSON schema, not JSON schema definition
      ? TName extends undefined
        ? never // If provided JSON schema, definition name is mandatory
        : TName extends keyof T['$defs']
          ? T['$defs'][TName] extends infer TDef extends JSONSchema7
            ? TSSchemaDefinitionIsEnum<TDef> extends true // If JSON schema definition found by name, detect if Enum or Modal
              ? JSONSchemaDefinitionEnumWrapper<TDef> // Return JSON Schema Enum definition
              : TSSchemaDefinitionIsModel<TDef> extends true
                ? JSONSchemaDefinitionModelWrapper<TDef> // Return JSON Schema Model definition
                : never
            : never
          : never
      : TName extends undefined // If JSON schema definition provided, no need to extract by name
        ? T extends JSONSchema7
          ? TSSchemaDefinitionIsEnum<T> extends true // Detect if Enum or Modal
            ? JSONSchemaDefinitionEnumWrapper<T> // Return JSON Schema Enum definition
            : TSSchemaDefinitionIsModel<T> extends true
              ? JSONSchemaDefinitionModelWrapper<T> // Return JSON Schema Model definition
              : never
          : never
        : never
    : never;
