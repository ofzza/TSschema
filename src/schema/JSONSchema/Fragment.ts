/**
 * Typescript utility for inferring a value type from a JSON schema fragment of any kind, by intersecting the types inferred by each keyword-specific
 * fragment utility.
 */

import type { JSONSchemaCollection, JSONSchemaNotCollectionFragment } from './CollectionFragment.js';
import type { JSONSchemaModelFragment, JSONSchemaModelFragmentType } from './ModelFragment.js';
import type { JSONSchemaConstFragment, JSONSchemaConstFragmentType } from './ConstFragment.js';
import type { JSONSchemaEnumFragment, JSONSchemaEnumFragmentType } from './EnumFragment.js';
import type { JSONSchemaPrimitiveTypeFragment, JSONSchemaPrimitiveTypeFragmentType } from './PrimitiveTypeFragment.js';
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
 * (yet) supported contributes `unknown`, i.e. no constraint. A union of fragments infers the union of each fragment's type.
 */
export type JSONSchemaFragmentType<T extends JSONSchemaNotCollectionFragment, TSchemaCollection extends JSONSchemaCollection = JSONSchemaCollection> =
  // Distribute over a union of fragments up front, so that a branch matching only some union members can not collapse the result to `unknown`
  T extends unknown ? _JSONSchemaFragmentType<T, TSchemaCollection> : never;
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
