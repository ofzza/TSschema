/**
 * Public type surface of the library.
 *
 * Re-exports the wrappers for a JSON schema collection, fragment and model property, and provides `TSSchemaName` and `TSSchemaType`, which infer names
 * and value types from any of them by dispatching to the per-module utilities based on what they are given, as well as `TSSchemaJSONSchema` and
 * `TSSchemaJSONCollection`, which an `as const` schema can be checked against with `satisfies`.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaModelFragment, JSONSchemaNotCollectionFragment } from './JSONSchema/index.js';
import type { JSONSchemaCollectionWrapper, TSSchemaFragmentName } from './TSSchemaCollection.js';
import type { JSONSchemaFragmentWrapper, TSSchemaFragmentPropertyName, TSSchemaModelType } from './TSSchemaFragment.js';
import type { JSONSchemaModelPropertyWrapper, TSSchemaPropertyType } from './TSSchemaProperty.js';

export type { TSSchemaCollection } from './TSSchemaCollection.js';
export type { TSSchemaFragment } from './TSSchemaFragment.js';
export type { TSSchemaProperty } from './TSSchemaProperty.js';

/**
 * Represents any JSON schema, with every property optionally read-only, so that a schema declared `as const` can be checked against it with `satisfies`
 * without losing its literal types.
 */
export type TSSchemaJSONSchema = JSONSchema7;
/**
 * Represents a JSON schema collection (a JSON schema defining its fragments in `$defs`), with every property optionally read-only, so that a collection
 * declared `as const` can be checked against it with `satisfies` without losing its literal types.
 */
export type TSSchemaJSONCollection = JSONSchemaCollection;

/**
 * Gets the names addressable within a JSON schema collection, model fragment or wrapper:
 * - a collection or collection wrapper infers the names of all its fragments,
 * - a model fragment or fragment wrapper infers the names of all the model's properties (a fragment which is not a model has no properties, and infers
 *   `never`),
 * - a model property wrapper, being structurally also a fragment wrapper of its parent model, infers the names of all the parent model's properties.
 */
export type TSSchemaName<T extends JSONSchemaCollection | JSONSchemaCollectionWrapper | JSONSchemaModelFragment | JSONSchemaFragmentWrapper> =
  // Model fragment, or fragment / model property wrapper (checked first, as every wrapper is also a collection wrapper): property names
  T extends JSONSchemaModelFragment | JSONSchemaFragmentWrapper
    ? TSSchemaFragmentPropertyName<T>
    : // Collection or collection wrapper: fragment names
      T extends JSONSchemaCollection | JSONSchemaCollectionWrapper
      ? TSSchemaFragmentName<T>
      : never;

/**
 * Infers a value type from a JSON schema fragment, a fragment wrapper or a model property wrapper, resolving `$ref`s against a JSON schema collection:
 * - a model property wrapper infers the type of the wrapped property (see `TSSchemaPropertyType`),
 * - a fragment wrapper or a fragment infers the type of the wrapped fragment (see `TSSchemaModelType`).
 *
 * An explicitly passed collection always takes precedence. When none is passed, a wrapper resolves against its own parent collection, while a fragment (or
 * a wrapper with no parent collection) has none to resolve against, so each of its `$ref`s infers `unknown`.
 */
export type TSSchemaType<
  T extends JSONSchemaNotCollectionFragment | JSONSchemaFragmentWrapper | JSONSchemaModelPropertyWrapper,
  TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection,
> =
  // Model property wrapper (checked first, as it is also a fragment wrapper of its parent model): property type
  T extends JSONSchemaModelPropertyWrapper
    ? TSSchemaPropertyType<T, TSchemaCollection>
    : // Fragment or fragment wrapper: fragment type
      T extends JSONSchemaNotCollectionFragment | JSONSchemaFragmentWrapper
      ? TSSchemaModelType<T, TSchemaCollection>
      : never;
