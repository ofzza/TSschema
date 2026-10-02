/**
 * Typescript utilities for type inference from a JSON schema definition of a model property type
 */

import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment, JSONSchemaModelFragment } from './JSONSchema.js';
import type { _TSPropertyName, JSONSchemaFragmentWrapper, TSSchemaFragmentPropertyName, UnwrapJSONSchemaFragmentWrapper } from './TSSchemaFragment.js';
import type { _TSSchemaFragmentName, JSONSchemaCollectionWrapper, TSSchemaFragmentName, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection.js';

/**
 * Wrapper type for a JSON schema model property definition, allowing type inference from the schema itself.
 */
export type JSONSchemaModelPropertyWrapper<
  T extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
  TModel extends JSONSchemaModelFragment = JSONSchemaModelFragment,
  TCollection extends JSONSchemaCollection = JSONSchemaCollection,
  TName extends _TSPropertyName<TModel> = _TSPropertyName<TModel>,
> = JSONSchemaFragmentWrapper<TModel, TCollection, TName> & {
  __property: T;
  __propertyName: TName;
};
/**
 * Unwraps a JSON schema model property definition wrapper to obtain the original JSON schema model property definition type.
 */
export type UnwrapJSONSchemaModelPropertyWrapper<T extends JSONSchemaNotCollectionFragment | JSONSchemaModelPropertyWrapper> =
  T extends JSONSchemaModelPropertyWrapper ? T['__property'] : T;

/**
 * Provides the type for the name of a JSON schema model property from within a model fragment addressed by name from a JSON schema collection or
 * JSON schema collection wrapper
 */
type _TSCollectionPropertyName<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper, TName> =
  UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection // Unwrap JSON schema collection
    ? TName extends _TSSchemaFragmentName<C> // Narrow fragment name against the unwrapped collection
      ? C['$defs'][TName] extends infer M extends JSONSchemaModelFragment // Check if addressed fragment is a model
        ? _TSPropertyName<M>
        : never
      : never
    : never;

/**
 * Provides a type-safe wrapper around a JSON schema definition for TypeScript type inference.
 */
export type TSSchemaModelProperty<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaModelFragment | JSONSchemaFragmentWrapper | JSONSchemaCollection | JSONSchemaCollectionWrapper,
  // A JSONSchemaFragmentWrapper is structurally also a JSONSchemaCollectionWrapper (both carry `__collection`), so model/fragment wrapper is checked first
  TName extends (T extends
    JSONSchemaModelFragment | JSONSchemaFragmentWrapper // Model: Property name
    ? TSSchemaFragmentPropertyName<T>
    : T extends
          JSONSchemaCollection | JSONSchemaCollectionWrapper // Collection: Collection fragment name
      ? TSSchemaFragmentName<T>
      : never) = never, // Else: Not needed
  TKey extends (T extends JSONSchemaFragmentWrapper // Fragment wrapper: Not needed (property name is passed as TName)
    ? never
    : T extends
          JSONSchemaCollection | JSONSchemaCollectionWrapper // Collection: Property name of the model fragment addressed by TName
      ? _TSCollectionPropertyName<T, TName>
      : never) = never, // Else: Not needed
> = T extends JSONSchemaFragmentWrapper // If T is a JSON schema fragment wrapper
  ? UnwrapJSONSchemaFragmentWrapper<T> extends infer M extends JSONSchemaModelFragment // Unwrap model fragment
    ? TName extends _TSPropertyName<M>
      ? _TSSchemaModelProperty<M, UnwrapJSONSchemaCollectionWrapper<T>, TName>
      : JSONSchemaModelPropertyWrapper
    : JSONSchemaModelPropertyWrapper
  : T extends
        JSONSchemaCollection | JSONSchemaCollectionWrapper // If T is a JSON schema collection
    ? UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection // Unwrap JSON schema collection
      ? TName extends _TSSchemaFragmentName<C>
        ? C['$defs'][TName] extends infer M extends JSONSchemaModelFragment // Check if addressed fragment is a model
          ? TKey extends _TSPropertyName<M>
            ? _TSSchemaModelProperty<M, C, TKey>
            : JSONSchemaModelPropertyWrapper
          : JSONSchemaModelPropertyWrapper
        : JSONSchemaModelPropertyWrapper
      : JSONSchemaModelPropertyWrapper
    : T extends JSONSchemaModelFragment // If T is a JSON schema model fragment
      ? TName extends _TSPropertyName<T>
        ? _TSSchemaModelProperty<T, JSONSchemaCollection, TName>
        : JSONSchemaModelPropertyWrapper
      : T extends JSONSchemaNotCollectionFragment // Else, T is a JSON schema model property fragment
        ? JSONSchemaModelPropertyWrapper<T>
        : JSONSchemaModelPropertyWrapper;

/**
 * Wraps a single property of an already unwrapped JSON schema model fragment
 */
type _TSSchemaModelProperty<
  TModel extends JSONSchemaModelFragment,
  TCollection extends JSONSchemaCollection,
  TKey extends _TSPropertyName<TModel>,
> = TModel['properties'][TKey] extends infer V extends JSONSchemaNotCollectionFragment
  ? JSONSchemaModelPropertyWrapper<V, TModel, TCollection, TKey>
  : JSONSchemaModelPropertyWrapper;

/**
 * Infers type from JSON schema fragment or JSON schema model property wrapper
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaModelPropertyType<T extends JSONSchemaNotCollectionFragment | JSONSchemaModelPropertyWrapper> = never; // !FIXME: Implement type inference
