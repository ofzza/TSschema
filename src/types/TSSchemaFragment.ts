/**
 * Typescript utilities for wrapping a single JSON schema fragment, either given directly or addressed by name from a JSON schema collection.
 *
 * A fragment addressed from a collection remembers its parent collection and its own name, so that any `$ref` it contains can be resolved when inferring
 * its value type. A fragment wrapped directly has no parent collection, and its `$ref`s only resolve against a collection passed explicitly.
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

/**
 * Wrapper type for a JSON schema fragment, holding on to the fragment as `__fragment`, its name as `__fragmentName` and its parent collection as
 * `__collection`. A fragment wrapped directly carries the default, unspecified collection and name.
 */
export type JSONSchemaFragmentWrapper<
  T extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
  TCollection extends JSONSchemaCollection = JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TCollection> = JSONSchemaFragmentName<TCollection>,
> = JSONSchemaCollectionWrapper<TCollection> & {
  __fragment: T;
  __fragmentName: TName;
};
/**
 * Unwraps a JSON schema fragment wrapper, or a model property wrapper, to obtain the wrapped JSON schema fragment (for a model property wrapper, its parent
 * model). A fragment that is not wrapped is returned as is.
 */
export type UnwrapJSONSchemaFragmentWrapper<T extends JSONSchemaNotCollectionFragment | JSONSchemaFragmentWrapper> = T extends JSONSchemaFragmentWrapper
  ? T['__fragment']
  : T;

/**
 * Wraps a JSON schema fragment, either given directly or addressed by name from a JSON schema collection or a JSON schema collection wrapper.
 *
 * A fragment addressed from a collection is wrapped together with the collection and its name. A union of names wraps each addressed fragment, and
 * omitting the name wraps every fragment of the collection, both resulting in a union of wrappers. As every wrapper is also a collection wrapper, a
 * fragment or model property wrapper can be passed in place of a collection, to address another fragment of its parent collection.
 */
export type TSSchemaFragment<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaCollection | JSONSchemaCollectionWrapper,
  TName extends (T extends JSONSchemaCollection | JSONSchemaCollectionWrapper ? TSSchemaFragmentName<T> : never) = never,
> =
  // Collection or collection wrapper: wrap the fragment(s) addressed by name, or every fragment if no name was given
  T extends JSONSchemaCollection | JSONSchemaCollectionWrapper
    ? UnwrapJSONSchemaCollectionWrapper<T> extends infer C extends JSONSchemaCollection
      ? _TSSchemaCollectionFragment<C, [TName] extends [never] ? JSONSchemaFragmentName<C> : TName>
      : JSONSchemaFragmentWrapper
    : // Fragment: wrap the fragment as given, with no parent collection
      T extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentWrapper<T>
      : JSONSchemaFragmentWrapper;
/**
 * Wraps each fragment of an already unwrapped JSON schema collection addressed by a (union of) name(s). A name that does not address a fragment of the
 * collection contributes `never`.
 */
type _TSSchemaCollectionFragment<TCollection extends JSONSchemaCollection, TName> =
  // Distribute over a union of names, and narrow each against the collection
  TName extends JSONSchemaFragmentName<TCollection>
    ? TCollection['$defs'][TName] extends infer F extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentWrapper<F, TCollection, TName>
      : never
    : never;

/**
 * Gets the names of all properties of a JSON schema model fragment or of the model fragment wrapped by a JSON schema fragment wrapper. A fragment that is
 * not a model has no properties and infers `never`; a union of fragments infers the union of their property names. The default, unspecified model infers
 * `string | number`.
 */
export type TSSchemaFragmentPropertyName<T extends JSONSchemaModelFragment | JSONSchemaFragmentWrapper = JSONSchemaModelFragment> =
  _TSSchemaFragmentPropertyName<UnwrapJSONSchemaFragmentWrapper<T>>;
/**
 * Gets the names of all properties of an already unwrapped JSON schema fragment, distributing over a union of fragments
 */
type _TSSchemaFragmentPropertyName<T> = T extends JSONSchemaModelFragment ? JSONSchemaFragmentPropertyName<T> : never;

/**
 * Infers a value type from a JSON schema fragment or a JSON schema fragment wrapper, resolving `$ref`s against a JSON schema collection.
 *
 * An explicitly passed collection always takes precedence. When none is passed, a wrapper resolves against its own parent collection, while a fragment (or
 * a wrapper with no parent collection) has none to resolve against, so each of its `$ref`s infers `unknown`. As a model property wrapper is structurally
 * also a fragment wrapper of its parent model, passing one infers the type of the parent model, not of the property (see `TSSchemaPropertyType`).
 */
export type TSSchemaModelType<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaFragmentWrapper,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> =
  // Fragment wrapper: infer from the wrapped fragment, against the explicitly passed collection if any, else against the wrapper's own collection
  T extends JSONSchemaFragmentWrapper
    ? T extends { __collection: infer C extends JSONSchemaCollection; __fragment: infer F extends JSONSchemaNotCollectionFragment }
      ? JSONSchemaFragmentType<F, JSONSchemaCollection extends TSchemaCollection ? C : TSchemaCollection>
      : unknown
    : // Fragment: infer from the fragment as given
      T extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentType<T, TSchemaCollection>
      : unknown;
