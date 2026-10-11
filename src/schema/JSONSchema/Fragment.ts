/**
 * Typescript utility for inferring a value type from a JSON schema fragment of any kind, by intersecting the types inferred by each keyword-specific
 * fragment utility.
 */

import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaModelFragment, JSONSchemaModelFragmentType } from './ModelFragment.js';
import type { JSONSchemaConstFragment, JSONSchemaConstFragmentType } from './ConstFragment.js';
import type { JSONSchemaEnumFragment, JSONSchemaEnumFragmentType } from './EnumFragment.js';
import type { JSONSchemaPrimitiveTypeFragment, JSONSchemaPrimitiveTypeFragmentType } from './PrimitiveTypeFragment.js';
import type { JSONSchemaNullTypeFragment, JSONSchemaNullTypeFragmentType } from './NullTypeFragment.js';
import type { JSONSchemaArrayTypeFragment, JSONSchemaArrayTypeFragmentType } from './ArrayTypeFragment.js';
import type { JSONSchemaObjectTypeFragment, JSONSchemaObjectTypeFragmentType } from './ObjectTypeFragment.js';
import type { JSONSchemaAllOfTypeFragment, JSONSchemaAllOfTypeFragmentType } from './AllOfTypeFragment.js';
import type { JSONSchemaAnyOfTypeFragment, JSONSchemaAnyOfTypeFragmentType } from './AnyOfTypeFragment.js';
import type { JSONSchemaOneOfTypeFragment, JSONSchemaOneOfTypeFragmentType } from './OneOfTypeFragment.js';
import type { JSONSchemaNotTypeFragment, JSONSchemaNotTypeFragmentType } from './NotTypeFragment.js';
import type { JSONSchemaReferenceFragment, JSONSchemaReferenceFragmentType } from './ReferenceFragment.js';

/**
 * Infers a value type from a JSON schema fragment.
 *
 * Every keyword the fragment carries contributes a type and all of them are intersected, so sibling keywords narrow each other (e.g. `type` + `enum`),
 * conflicting keywords resolve to `never` and a `$ref` is intersected with its siblings (as in JSON schema 2019-09 and later). A keyword that is not
 * (yet) supported contributes `unknown`, i.e. no constraint. A union of fragments infers the union of each fragment's type. A `type` array naming
 * `object`, `array` and / or `null` infers the union of the types of its branches (see `JSONSchemaFragmentTypeBranch`).
 */
export type JSONSchemaFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection> =
  // Distribute over a union of fragments up front, so that a branch matching only some union members can not collapse the result to `unknown`
  T extends unknown
    ? // Distribute over the branches of a type array (as alternatives, unlike sibling keywords, which are intersected)
      JSONSchemaFragmentTypeBranch<T> extends infer B
      ? B extends JSONSchemaNotCollectionFragment
        ? _JSONSchemaFragmentType<B, TSchemaCollection>
        : never
      : never
    : never;
/**
 * Infers a value type from a single (non-union) JSON schema fragment, by intersecting the types contributed by each keyword
 */
type _JSONSchemaFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection> =
  // Model type
  (T extends JSONSchemaModelFragment ? JSONSchemaModelFragmentType<T, TSchemaCollection> : unknown) &
    // Const type
    (T extends JSONSchemaConstFragment ? JSONSchemaConstFragmentType<T> : unknown) &
    // Enum type
    (T extends JSONSchemaEnumFragment ? JSONSchemaEnumFragmentType<T> : unknown) &
    // Primitive type
    (T extends JSONSchemaPrimitiveTypeFragment ? JSONSchemaPrimitiveTypeFragmentType<T> : unknown) &
    // Null type
    (T extends JSONSchemaNullTypeFragment ? JSONSchemaNullTypeFragmentType<T> : unknown) &
    // Array type
    (T extends JSONSchemaArrayTypeFragment ? JSONSchemaArrayTypeFragmentType<T, TSchemaCollection> : unknown) &
    // Object type
    (T extends JSONSchemaObjectTypeFragment ? JSONSchemaObjectTypeFragmentType<T, TSchemaCollection> : unknown) &
    // AllOf type
    (T extends JSONSchemaAllOfTypeFragment ? JSONSchemaAllOfTypeFragmentType<T, TSchemaCollection> : unknown) &
    // AnyOf type
    (T extends JSONSchemaAnyOfTypeFragment ? JSONSchemaAnyOfTypeFragmentType<T, TSchemaCollection> : unknown) &
    // OneOf type
    (T extends JSONSchemaOneOfTypeFragment ? JSONSchemaOneOfTypeFragmentType<T, TSchemaCollection> : unknown) &
    // Not type
    (T extends JSONSchemaNotTypeFragment ? JSONSchemaNotTypeFragmentType<T, TSchemaCollection> : unknown) &
    // Reference type
    (T extends JSONSchemaReferenceFragment ? JSONSchemaReferenceFragmentType<T, TSchemaCollection> : unknown);

/**
 * Splits a JSON schema fragment whose `type` is an array naming `object`, `array` and / or `null` into a union of branches, one per group of type names
 * (`object`, `array`, `null`, and all primitive types together as an array of type names). Each branch is the fragment with `type` narrowed to the group,
 * keeping every other keyword, so that keywords applying regardless of type (e.g. `enum`) constrain every branch. Any other fragment is returned as is, as
 * a type array of primitive types only is supported by the primitive type fragment directly.
 */
export type JSONSchemaFragmentTypeBranch<T> =
  // Type array: split if it names a non primitive type
  T extends { type: infer U extends ReadonlyArray<unknown> }
    ? [Extract<U[number], 'object' | 'array' | 'null'>] extends [never]
      ? T
      : _JSONSchemaFragmentTypeGroup<U[number]> extends infer G
        ? // Distribute over the groups, narrowing the fragment's type to each
          G extends unknown
          ? { [K in keyof T]: K extends 'type' ? G : T[K] }
          : never
        : never
    : // Any other fragment: as is
      T;
/**
 * Groups a union of type names into `object`, `array`, `null`, and all other (primitive) type names together as an array of type names
 */
type _JSONSchemaFragmentTypeGroup<TName> =
  | ('object' extends TName ? 'object' : never)
  | ('array' extends TName ? 'array' : never)
  | ('null' extends TName ? 'null' : never)
  | ([Exclude<TName, 'object' | 'array' | 'null'>] extends [never] ? never : Array<Exclude<TName, 'object' | 'array' | 'null'>>);
