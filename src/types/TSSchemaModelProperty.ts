/**
 * Typescript utilities for type inference from a JSON schema definition of a model property type
 */

import type { JSONSchemaFragmentCollection, JSONSchemaFragmentNotCollection, JSONSchemaFragmentModel } from './JSONSchema';
import { JSONSchemaWrapper, UnwrapJSONSchemaWrapper } from './TSSchema';
import { JSONSchemaCollectionWrapper, TSSchemaName } from './TSSchemaCollection';
import { TSPropertyName } from './TSSchemaModel';

/**
 * Wrapper type for a JSON schema model property definition, allowing type inference from the schema itself.
 */
export type JSONSchemaModelPropertyWrapper<
  T extends JSONSchemaFragmentNotCollection = JSONSchemaFragmentNotCollection,
  TModel extends JSONSchemaFragmentModel = JSONSchemaFragmentModel,
  TCollection extends JSONSchemaFragmentCollection = JSONSchemaFragmentCollection,
> = {
  __definition: T;
  __model: TModel;
  __collection: TCollection;
};
/**
 * Unwraps a JSON schema model property definition wrapper to obtain the original JSON schema model property definition type.
 */
export type UnwrapJSONSchemaModelPropertyWrapper<T extends JSONSchemaFragmentNotCollection | JSONSchemaWrapper> =
  T extends JSONSchemaWrapper<JSONSchemaFragmentNotCollection> ? T['__definition'] : T;

/**
 * Provides a type-safe wrapper around a JSON schema definition for TypeScript type inference.
 */
export type TSSchemaModelProperty<
  T extends JSONSchemaFragmentNotCollection | JSONSchemaFragmentModel | JSONSchemaWrapper | JSONSchemaFragmentCollection | JSONSchemaCollectionWrapper,
  TName extends never = never,
  TKey extends never = never,
> = never; // FIXME: Implement

/*
T extends
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
*/

/**
 * Infers model property type from JSON schema definition
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaModelPropertyType<T extends JSONSchemaFragmentModel | JSONSchemaWrapper> = never; // FIXME: Implement type inference
