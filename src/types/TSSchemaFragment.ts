/**
 * Typescript utilities for type inference from a JSON schema definitions
 */

// FIXME: Append enum handling on top of Value and Model schemas

import type { JSONSchemaCollection, JSONSchemaModelFragment, JSONSchemaNotCollectionFragment } from './JSONSchema';
import type { _TSSchemaFragmentName, JSONSchemaCollectionWrapper, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection';
import type { TSSchemaFragmentName } from './TSSchemaCollection';

/**
 * Wrapper type for a JSON schema definition, allowing type inference from the schema itself.
 */
export type JSONSchemaFragmentWrapper<
  T extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
  TCollection extends JSONSchemaCollection = JSONSchemaCollection,
  TName extends _TSSchemaFragmentName<TCollection> = _TSSchemaFragmentName<TCollection>,
> = JSONSchemaCollectionWrapper<TCollection> & {
  __model: T;
  __modelName: TName;
};
/**
 * Unwraps a JSON schema definition wrapper to obtain the original JSON schema definition type.
 */
export type UnwrapJSONSchemaFragmentWrapper<T extends JSONSchemaNotCollectionFragment | JSONSchemaFragmentWrapper> = T extends JSONSchemaFragmentWrapper
  ? T['__model']
  : T;

/**
 * Provides a type-safe wrapper around a JSON schema definition for TypeScript type inference.
 */
export type TSSchemaFragment<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaCollection | JSONSchemaCollectionWrapper,
  TName extends (T extends JSONSchemaCollection | JSONSchemaCollectionWrapper ? TSSchemaFragmentName<T> : never) = never,
> = T extends
  JSONSchemaCollection | JSONSchemaCollectionWrapper // If T is a JSON schema collection or a JSON definition collection wrapper
  ? UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection // Unwrap JSON schema collection
    ? TName extends keyof C['$defs']
      ? C['$defs'][TName] extends infer M extends JSONSchemaNotCollectionFragment // Check if requested model exists on schema collection
        ? JSONSchemaFragmentWrapper<M, C, TName>
        : JSONSchemaFragmentWrapper // Fall through to default JSON schema definition
      : JSONSchemaFragmentWrapper
    : T extends JSONSchemaNotCollectionFragment // Fall through to wrapping schema as given
      ? JSONSchemaFragmentWrapper<T>
      : JSONSchemaFragmentWrapper
  : T extends JSONSchemaNotCollectionFragment // Fall through to wrapping schema as given
    ? JSONSchemaFragmentWrapper<T>
    : JSONSchemaFragmentWrapper;

/**
 * Provides the type for the name of a JSON schema model property from within the JSON schema model fragment
 */
export type _TSPropertyName<T extends JSONSchemaModelFragment = JSONSchemaModelFragment> = keyof T['properties'];

/**
 * Provides the type for the name of a JSON schema model property from within the JSON schema model fragment or JSON schema fragment wrapper
 */
export type TSSchemaFragmentPropertyName<T extends JSONSchemaModelFragment | JSONSchemaFragmentWrapper = JSONSchemaModelFragment> =
  UnwrapJSONSchemaFragmentWrapper<T> extends infer U extends JSONSchemaModelFragment ? keyof U['properties'] : string | number;

/**
 * Infers type from JSON schema fragment or JSON schema fragment wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaFragmentType<T extends JSONSchemaNotCollectionFragment | JSONSchemaFragmentWrapper> = never; // !FIXME: Implement type inference
