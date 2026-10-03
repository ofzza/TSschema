/**
 * Typescript utilities for wrapping a single property of a JSON schema model fragment.
 *
 * A property can be wrapped directly, or addressed by name from a model fragment, a fragment wrapper or (together with its model's name) a JSON schema
 * collection. It remembers its parent model, the model's name and parent collection when they are known, so that any `$ref` it contains can be resolved
 * when inferring its value type.
 */

import type {
  JSONSchemaCollection,
  JSONSchemaFragmentName,
  JSONSchemaFragmentPropertyName,
  JSONSchemaFragmentType,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
} from './JSONSchema.js';
import type { JSONSchemaCollectionWrapper, TSSchemaFragmentName, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection.js';
import type { JSONSchemaFragmentWrapper, TSSchemaFragmentPropertyName } from './TSSchemaFragment.js';

/**
 * Wrapper type for a JSON schema model property, holding on to the property fragment as `__property` and its name as `__propertyName`. It extends the
 * fragment wrapper of its parent model, so it also holds the parent model as `__fragment`, the model's name as `__fragmentName` and the parent collection
 * as `__collection`. A property wrapped directly carries the default, unspecified model, collection and names.
 */
export type JSONSchemaModelPropertyWrapper<
  T extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
  TModel extends JSONSchemaModelFragment = JSONSchemaModelFragment,
  TCollection extends JSONSchemaCollection = JSONSchemaCollection,
  TModelName extends JSONSchemaFragmentName<TCollection> = JSONSchemaFragmentName<TCollection>,
  TName extends JSONSchemaFragmentPropertyName<TModel> = JSONSchemaFragmentPropertyName<TModel>,
> = JSONSchemaFragmentWrapper<TModel, TCollection, TModelName> & {
  __property: T;
  __propertyName: TName;
};
/**
 * Unwraps a JSON schema model property wrapper to obtain the wrapped JSON schema property fragment. A fragment that is not wrapped is returned as is.
 */
export type UnwrapJSONSchemaModelPropertyWrapper<T extends JSONSchemaNotCollectionFragment | JSONSchemaModelPropertyWrapper> =
  T extends JSONSchemaModelPropertyWrapper ? T['__property'] : T;

/**
 * Gets the names of all properties of the model fragment(s) addressed by a (union of) name(s) from a JSON schema collection or a JSON schema collection
 * wrapper. A name addressing a fragment that is not a model contributes `never`.
 */
type _TSCollectionPropertyName<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper, TName> =
  UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection
    ? // Distribute over a union of names, and narrow each against the unwrapped collection
      TName extends JSONSchemaFragmentName<C>
      ? C['$defs'][TName] extends infer M extends JSONSchemaModelFragment
        ? JSONSchemaFragmentPropertyName<M>
        : never
      : never
    : never;

/**
 * Wraps a JSON schema model property, either given directly or addressed by name from:
 * - a model fragment: `TSSchemaProperty<TModel, TName>`,
 * - a fragment wrapper (wrapping a model): `TSSchemaProperty<TFragmentWrapper, TName>`,
 * - a collection or a collection wrapper: `TSSchemaProperty<TCollection, TModelName, TName>`.
 *
 * Omitting a name (`TName`, or `TModelName` for a collection) addresses every property (of every model fragment), and a union of names addresses each
 * named one, both resulting in a union of wrappers. A model fragment given without a name is itself wrapped as a property (e.g. an inline nested model).
 * A fragment that is not a model has no properties, so addressing it infers `never`. As a model property wrapper is structurally also a fragment wrapper of
 * its parent model, passing one in place of a fragment wrapper addresses a sibling property.
 */
export type TSSchemaProperty<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaModelFragment | JSONSchemaFragmentWrapper | JSONSchemaCollection | JSONSchemaCollectionWrapper,
  // Model or fragment wrapper (checked first, as a fragment wrapper is also a collection wrapper): property name
  TName extends (T extends JSONSchemaModelFragment | JSONSchemaFragmentWrapper
    ? TSSchemaFragmentPropertyName<T>
    : // Collection or collection wrapper: model fragment name
      T extends JSONSchemaCollection | JSONSchemaCollectionWrapper
      ? TSSchemaFragmentName<T>
      : // Property fragment: not used
        never) = never,
  // Fragment wrapper: not used, as the property name is passed as `TName`
  TKey extends (T extends JSONSchemaFragmentWrapper
    ? never
    : // Collection or collection wrapper: property name of the model fragment(s) addressed by `TName`
      T extends JSONSchemaCollection | JSONSchemaCollectionWrapper
      ? _TSCollectionPropertyName<T, TName>
      : // Model or property fragment: not used
        never) = never,
> =
  // Fragment wrapper (checked before collection wrapper, which it also is): wrap the named property(ies) of the wrapped model, with its context
  T extends JSONSchemaFragmentWrapper
    ? T extends { __collection: infer C extends JSONSchemaCollection; __fragment: infer M; __fragmentName: infer N }
      ? M extends JSONSchemaModelFragment
        ? _TSSchemaProperty<M, C, N, [TName] extends [never] ? JSONSchemaFragmentPropertyName<M> : TName>
        : never
      : never
    : // Collection or collection wrapper: wrap the named property(ies) of the named model(s)
      T extends JSONSchemaCollection | JSONSchemaCollectionWrapper
      ? UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection
        ? _TSSchemaCollectionModelProperty<C, [TName] extends [never] ? JSONSchemaFragmentName<C> : TName, TKey>
        : never
      : // Model fragment: wrap the named property(ies), or with no name wrap the model itself as a property
        T extends JSONSchemaModelFragment
        ? [TName] extends [never]
          ? JSONSchemaModelPropertyWrapper<T>
          : _TSSchemaProperty<T, JSONSchemaCollection, JSONSchemaFragmentName, TName>
        : // Property fragment: wrap the fragment as given, with no parent model
          T extends JSONSchemaNotCollectionFragment
          ? JSONSchemaModelPropertyWrapper<T>
          : JSONSchemaModelPropertyWrapper;
/**
 * Wraps the named property(ies) of each model fragment addressed by a (union of) name(s) from an already unwrapped JSON schema collection. Omitting the
 * property name wraps every property. A name addressing a fragment that is not a model contributes `never`.
 */
type _TSSchemaCollectionModelProperty<TCollection extends JSONSchemaCollection, TModelName, TKey> =
  // Distribute over a union of model names, and narrow each against the collection
  TModelName extends JSONSchemaFragmentName<TCollection>
    ? TCollection['$defs'][TModelName] extends infer M extends JSONSchemaModelFragment
      ? _TSSchemaProperty<M, TCollection, TModelName, [TKey] extends [never] ? JSONSchemaFragmentPropertyName<M> : TKey>
      : never
    : never;
/**
 * Wraps each property addressed by a (union of) name(s) from an already unwrapped JSON schema model fragment, together with its context. A name that does
 * not address a property of the model contributes `never`.
 */
type _TSSchemaProperty<TModel extends JSONSchemaModelFragment, TCollection extends JSONSchemaCollection, TModelName, TName> =
  // Distribute over a union of property names, and narrow each against the model
  TName extends JSONSchemaFragmentPropertyName<TModel>
    ? Exclude<TModel['properties'][TName], undefined> extends infer P extends JSONSchemaNotCollectionFragment
      ? JSONSchemaModelPropertyWrapper<P, TModel, TCollection, TModelName & JSONSchemaFragmentName<TCollection>, TName>
      : never
    : never;

/**
 * Infers a value type from a JSON schema property fragment or a JSON schema model property wrapper, resolving `$ref`s against a JSON schema collection.
 *
 * An explicitly passed collection always takes precedence. When none is passed, a wrapper resolves against its own parent collection, while a fragment (or
 * a wrapper with no parent collection) has none to resolve against, so each of its `$ref`s infers `unknown`.
 */
export type TSSchemaPropertyType<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaModelPropertyWrapper,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> =
  // Model property wrapper: infer from the wrapped property, against the explicitly passed collection if any, else against the wrapper's own collection
  T extends JSONSchemaModelPropertyWrapper
    ? T extends { __collection: infer C extends JSONSchemaCollection; __property: infer P extends JSONSchemaNotCollectionFragment }
      ? JSONSchemaFragmentType<P, JSONSchemaCollection extends TSchemaCollection ? C : TSchemaCollection>
      : unknown
    : // Property fragment: infer from the fragment as given
      T extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentType<T, TSchemaCollection>
      : unknown;
