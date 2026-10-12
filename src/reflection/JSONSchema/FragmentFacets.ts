/**
 * Entry point parsing a whole JSON schema, the router parsing a JSON schema fragment of any kind by instantiating every per-keyword fragment
 * facet matching it, and the types inferring which facets a fragment gets: the runtime counterpart of `JSONSchemaFragmentType`'s dispatch over
 * keywords.
 *
 * This file and the per-keyword facet files import each other as values, on purpose: the router instantiates every facet class, and the
 * facets of fragments with nested fragments (models, arrays, `allOf`, ...) parse those through the router. That cycle is safe as long as the
 * router only references the facet classes (the collection facet included) inside function bodies (never at the top level of the module), and
 * the base class they all extend lives outside of the cycle, in `Fragment.ts`.
 */

import type {
  JSONSchema7,
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
  JSONSchemaFragmentName,
  JSONSchemaFragmentTypeBranch,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
  JSONSchemaNotTypeFragment,
  JSONSchemaNullTypeFragment,
  JSONSchemaObjectTypeFragment,
  JSONSchemaOneOfTypeFragment,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaReferenceFragment,
} from '../../schema/JSONSchema/index.js';
import { JSONSchemaCollectionFragmentFacet } from './CollectionFragment.js';
import {
  getJSONSchemaFragmentTypeBranches,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentFacet,
  type JSONSchemaFragmentFacetOptions,
} from './Fragment.js';
import { isJSONSchemaObject } from './JSONSchema7.js';
import { JSONSchemaModelFragmentFacet } from './ModelFragment.js';
import { JSONSchemaConstFragmentFacet } from './ConstFragment.js';
import { JSONSchemaEnumFragmentFacet } from './EnumFragment.js';
import { JSONSchemaPrimitiveTypeFragmentFacet } from './PrimitiveTypeFragment.js';
import { JSONSchemaNullTypeFragmentFacet } from './NullTypeFragment.js';
import { JSONSchemaArrayTypeFragmentFacet } from './ArrayTypeFragment.js';
import { JSONSchemaObjectTypeFragmentFacet } from './ObjectTypeFragment.js';
import { JSONSchemaAllOfTypeFragmentFacet } from './AllOfTypeFragment.js';
import { JSONSchemaAnyOfTypeFragmentFacet } from './AnyOfTypeFragment.js';
import { JSONSchemaOneOfTypeFragmentFacet } from './OneOfTypeFragment.js';
import { JSONSchemaNotTypeFragmentFacet } from './NotTypeFragment.js';
import { JSONSchemaReferenceFragmentFacet } from './ReferenceFragment.js';

// #region Entry point

/**
 * Parses a JSON schema, by every facet class its root fragment matches. The default way to parse a schema.
 *
 * A collection (a schema with `$defs`) is parsed as a collection facet, parsing every `$defs` fragment by name, followed by the facets of
 * the root's other keywords (the schema with its `$defs` left out). The collection facet is the context every `$ref` in the schema is resolved
 * against. Any other schema is parsed with no such context, so none of its `$ref` can be resolved.
 * @param fragment JSON schema to parse
 * @returns Facets of all fragment types the schema's root fragment matches, or an empty array if it matches none
 */
export function parseJSONSchema<TFragment extends JSONSchema7>(fragment: TFragment): Array<JSONSchemaFacet<TFragment>> {
  // Parse a collection, and its root fragment against it
  if (JSONSchemaCollectionFragmentFacet.is(fragment)) {
    const collection = new JSONSchemaCollectionFragmentFacet(fragment);
    const { $defs: _defs, ...root } = fragment;
    return [collection, ...createJSONSchemaFragmentFacets(root as JSONSchemaNotCollectionFragment, { context: collection })] as Array<
      JSONSchemaFacet<TFragment>
    >;
  }
  // Parse any other fragment, with no collection to resolve references against
  return createJSONSchemaFragmentFacets(fragment as JSONSchemaNotCollectionFragment) as Array<JSONSchemaFacet<TFragment>>;
}

/**
 * Parses a JSON schema collection (a schema with `$defs`) as a collection facet alone, parsing every `$defs` fragment by name. The shortcut for
 * the common case of a schema used as a collection of definitions.
 *
 * Unlike `parseJSONSchema`, it does not parse the root's other keywords. Each call parses the schema anew, so the collection facet it returns is
 * never the one `parseJSONSchema` returns for the same schema, and neither are any of the facets it holds.
 * @param fragment JSON schema collection to parse
 * @returns Facet of the collection
 */
export function parseJSONSchemaCollection<TFragment extends JSONSchemaCollection>(fragment: TFragment): JSONSchemaCollectionFragmentFacet<TFragment> {
  // Reject a non-collection, only possible from untyped code
  if (!JSONSchemaCollectionFragmentFacet.is(fragment)) throw new TypeError('A JSON schema collection must contain a `$defs` object');
  return new JSONSchemaCollectionFragmentFacet(fragment);
}

// #endregion

// #region Router

/**
 * Parses a JSON schema fragment, by instantiating every fragment facet type matching it.
 *
 * A `type` array naming `object`, `array` and / or `null` is split into branches first (see `getJSONSchemaFragmentTypeBranches`). A single branch is
 * parsed as if `type` named its group directly. Several branches are alternatives (a value is of one of them), so they are parsed as an implicit
 * `anyOf`: the type independent keywords (`const`, `enum`, `$ref`, `allOf`, `anyOf`, `oneOf`, `not`) are parsed on the fragment itself, and one more
 * (`implicit`) any-of-types facet holds the branches, each with the type independent keywords left out.
 * @param fragment JSON fragment to parse
 * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
 * @returns Facets of all fragment types the fragment matches, or an empty array if it matches none
 */
export function createJSONSchemaFragmentFacets<
  TSchema extends JSONSchemaCollection,
  TFragment extends JSONSchemaNotCollectionFragment,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = undefined,
>(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}): Array<JSONSchemaFragmentFacetOf<TSchema, TName, TFragment>> {
  // Parse a single type array branch as is
  const branches = getJSONSchemaFragmentTypeBranches(fragment);
  if (branches.length === 1 && branches[0] !== fragment)
    return createJSONSchemaFragmentFacets(branches[0] as JSONSchemaNotCollectionFragment, options) as Array<
      JSONSchemaFragmentFacetOf<TSchema, TName, TFragment>
    >;

  // Parse every matching keyword, in the order the type layer intersects them in
  const facets: Array<JSONSchemaFragmentFacet<TSchema, TName, any>> = [];
  if (JSONSchemaModelFragmentFacet.is(fragment)) facets.push(new JSONSchemaModelFragmentFacet(fragment, options));
  if (JSONSchemaConstFragmentFacet.is(fragment)) facets.push(new JSONSchemaConstFragmentFacet(fragment, options));
  if (JSONSchemaEnumFragmentFacet.is(fragment)) facets.push(new JSONSchemaEnumFragmentFacet(fragment, options));
  if (JSONSchemaPrimitiveTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaPrimitiveTypeFragmentFacet(fragment, options));
  if (JSONSchemaNullTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaNullTypeFragmentFacet(fragment, options));
  if (JSONSchemaArrayTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaArrayTypeFragmentFacet(fragment, options));
  if (JSONSchemaObjectTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaObjectTypeFragmentFacet(fragment, options));
  if (branches.length > 1) {
    const anyOf = branches.map((branch) =>
      Object.fromEntries(Object.entries(branch).filter(([keyword]) => !(_JSONSchemaTypeIndependentKeywords as ReadonlyArray<string>).includes(keyword))),
    ) as ReadonlyArray<JSONSchemaNotCollectionFragment>;
    facets.push(new JSONSchemaAnyOfTypeFragmentFacet({ anyOf }, { ...options, implicit: true }));
  }
  if (JSONSchemaAllOfTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaAllOfTypeFragmentFacet(fragment, options));
  if (JSONSchemaAnyOfTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaAnyOfTypeFragmentFacet(fragment, options));
  if (JSONSchemaOneOfTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaOneOfTypeFragmentFacet(fragment, options));
  if (JSONSchemaNotTypeFragmentFacet.is(fragment)) facets.push(new JSONSchemaNotTypeFragmentFacet(fragment, options));
  if (JSONSchemaReferenceFragmentFacet.is(fragment)) facets.push(new JSONSchemaReferenceFragmentFacet(fragment, options));
  return facets as Array<JSONSchemaFragmentFacetOf<TSchema, TName, TFragment>>;
}

/**
 * Parses a fragment nested in, and owned by, another fragment (e.g. a model property or an `allOf` member). Nested fragments have no name.
 * @param fragment Nested JSON fragment to parse
 * @param context Facet of the JSON schema collection the parent fragment belongs to, or `undefined` if the parsed schema has no `$defs`
 * @returns Facets of all fragment types the nested fragment matches, or an empty array if it is not a schema object (e.g. a boolean schema)
 */
export function createJSONSchemaNestedFragmentFacets<TSchema extends JSONSchemaCollection, TFragment>(
  fragment: TFragment,
  context: JSONSchemaCollectionFragmentFacet<TSchema> | undefined,
): JSONSchemaNestedFragmentFacets<TSchema, TFragment> {
  return (
    isJSONSchemaObject(fragment) ? createJSONSchemaFragmentFacets(fragment as JSONSchemaNotCollectionFragment, { context }) : []
  ) as JSONSchemaNestedFragmentFacets<TSchema, TFragment>;
}

/**
 * Keywords which constrain a value regardless of its type, and are parsed by their own fragment facet types
 */
const _JSONSchemaTypeIndependentKeywords = ['const', 'enum', '$ref', 'allOf', 'anyOf', 'oneOf', 'not'] as const;

// #endregion

// #region Facet types

/**
 * Infers the facets of a JSON schema, as `parseJSONSchema` returns them: the type of each element of the returned array. A collection infers the
 * collection facet and the facets of its root fragment (see `JSONSchemaCollectionRootFragment`), any other schema the facets of the
 * fragment itself, in the unspecified collection (`JSONSchemaCollection`) as no collection is known.
 */
export type JSONSchemaFacet<TFragment extends JSONSchema7> =
  // Collection
  TFragment extends JSONSchemaCollection
    ? JSONSchemaCollectionFragmentFacet<TFragment> | JSONSchemaFragmentFacetOf<TFragment, undefined, JSONSchemaCollectionRootFragment<TFragment>>
    : // Any other fragment
      TFragment extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentFacetOf<JSONSchemaCollection, undefined, TFragment>
      : never;

/**
 * Infers the facets of a JSON schema fragment, as the union of the facet types matching it: the type of each element of the array the router
 * returns for the fragment.
 *
 * A facet type matches when the fragment matches its fragment type (e.g. `JSONSchemaModelFragment`), as in `JSONSchemaFragmentType`. A union of
 * fragments infers the union of each fragment's facets, and a `type` array split into several branches (see `JSONSchemaFragmentTypeBranch`) infers
 * the implicit any-of-types facet holding them. A fragment with no keywords infers `never` (no facets), while the unspecified fragment
 * (`JSONSchemaNotCollectionFragment`) infers every facet type.
 */
export type JSONSchemaFragmentFacetOf<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  // Distribute over a union of fragments up front
  TFragment extends unknown
    ? // Fragment with no keywords: no facets
      [keyof TFragment] extends [never]
      ? never
      : // Unspecified fragment: any facet
        JSONSchemaNotCollectionFragment extends TFragment
        ? _JSONSchemaAnyFragmentFacet<TSchema, TName, TFragment>
        : // Type array split into several branches: the facets of the type independent keywords, and the implicit `anyOf`
          JSONSchemaFragmentTypeBranch<TFragment> extends infer B extends JSONSchemaNotCollectionFragment
          ? true extends _IsUnion<B>
            ? _JSONSchemaFragmentFacetOf<TSchema, TName, TFragment> | _JSONSchemaImplicitAnyOfTypeFragmentFacet<TSchema, TName, B>
            : // Single branch, or a fragment needing no split
              _JSONSchemaFragmentFacetOf<TSchema, TName, B>
          : never
    : never;

/**
 * Infers the facets of a single (non-union, unsplit) JSON schema fragment, as the union of the facet types matching it
 */
type _JSONSchemaFragmentFacetOf<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  // Model facet
  | (TFragment extends infer F extends JSONSchemaModelFragment ? JSONSchemaModelFragmentFacet<TSchema, TName, F> : never)
  // Const facet
  | (TFragment extends infer F extends JSONSchemaConstFragment ? JSONSchemaConstFragmentFacet<TSchema, TName, F> : never)
  // Enum facet
  | (TFragment extends infer F extends JSONSchemaEnumFragment ? JSONSchemaEnumFragmentFacet<TSchema, TName, F> : never)
  // Primitive type facet
  | (TFragment extends infer F extends JSONSchemaPrimitiveTypeFragment ? JSONSchemaPrimitiveTypeFragmentFacet<TSchema, TName, F> : never)
  // Null type facet
  | (TFragment extends infer F extends JSONSchemaNullTypeFragment ? JSONSchemaNullTypeFragmentFacet<TSchema, TName, F> : never)
  // Array type facet
  | (TFragment extends infer F extends JSONSchemaArrayTypeFragment ? JSONSchemaArrayTypeFragmentFacet<TSchema, TName, F> : never)
  // Object type facet
  | (TFragment extends infer F extends JSONSchemaObjectTypeFragment ? JSONSchemaObjectTypeFragmentFacet<TSchema, TName, F> : never)
  // AllOf type facet
  | (TFragment extends infer F extends JSONSchemaAllOfTypeFragment ? JSONSchemaAllOfTypeFragmentFacet<TSchema, TName, F> : never)
  // AnyOf type facet
  | (TFragment extends infer F extends JSONSchemaAnyOfTypeFragment ? JSONSchemaAnyOfTypeFragmentFacet<TSchema, TName, F> : never)
  // OneOf type facet
  | (TFragment extends infer F extends JSONSchemaOneOfTypeFragment ? JSONSchemaOneOfTypeFragmentFacet<TSchema, TName, F> : never)
  // Not type facet
  | (TFragment extends infer F extends JSONSchemaNotTypeFragment ? JSONSchemaNotTypeFragmentFacet<TSchema, TName, F> : never)
  // Reference facet
  | (TFragment extends infer F extends JSONSchemaReferenceFragment ? JSONSchemaReferenceFragmentFacet<TSchema, TName, F> : never);

/**
 * Infers every facet type an unspecified JSON schema fragment could match, as a union of facet types
 */
type _JSONSchemaAnyFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  | JSONSchemaModelFragmentFacet<TSchema, TName, TFragment & JSONSchemaModelFragment>
  | JSONSchemaConstFragmentFacet<TSchema, TName, TFragment & JSONSchemaConstFragment>
  | JSONSchemaEnumFragmentFacet<TSchema, TName, TFragment & JSONSchemaEnumFragment>
  | JSONSchemaPrimitiveTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaPrimitiveTypeFragment>
  | JSONSchemaNullTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaNullTypeFragment>
  | JSONSchemaArrayTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaArrayTypeFragment>
  | JSONSchemaObjectTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaObjectTypeFragment>
  | JSONSchemaAllOfTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaAllOfTypeFragment>
  | JSONSchemaAnyOfTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaAnyOfTypeFragment>
  | JSONSchemaOneOfTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaOneOfTypeFragment>
  | JSONSchemaNotTypeFragmentFacet<TSchema, TName, TFragment & JSONSchemaNotTypeFragment>
  | JSONSchemaReferenceFragmentFacet<TSchema, TName, TFragment & JSONSchemaReferenceFragment>;

/**
 * Infers the implicit any-of-types facet of a `type` array split into several branches, holding a branch per group of type names, each with the
 * type independent keywords left out
 */
type _JSONSchemaImplicitAnyOfTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TBranch extends JSONSchemaNotCollectionFragment,
> = JSONSchemaAnyOfTypeFragmentFacet<
  TSchema,
  TName,
  {
    anyOf: ReadonlyArray<
      TBranch extends unknown ? { [K in keyof TBranch as K extends (typeof _JSONSchemaTypeIndependentKeywords)[number] ? never : K]: TBranch[K] } : never
    >;
  }
>;

/**
 * Determines if a type is a union of several types, resolving to `boolean` for a union, and `false` otherwise
 */
type _IsUnion<T, TAll = T> = T extends unknown ? ([TAll] extends [T] ? false : true) : never;

/**
 * Infers the facets of a fragment nested in another fragment, as the router returns them (see `JSONSchemaParsedFragment`)
 */
export type JSONSchemaNestedFragmentFacets<TSchema extends JSONSchemaCollection, TFragment> = Array<
  JSONSchemaFragmentFacetOf<TSchema, undefined, JSONSchemaParsedFragment<TFragment>>
>;

/**
 * Infers the facets of each fragment in an array of nested fragments, element by element for a tuple
 */
export type JSONSchemaNestedFragmentsFacets<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  -readonly [I in keyof TFragments]: JSONSchemaNestedFragmentFacets<TSchema, TFragments[I]>;
};

/**
 * Gets the fragment type a value is parsed as: a (non-collection) fragment as is, an object of any other shape as the unspecified fragment, and
 * anything else (a boolean schema, an array) as `never`, i.e. with no facets
 */
export type JSONSchemaParsedFragment<T> =
  // Fragment
  T extends JSONSchemaNotCollectionFragment
    ? T
    : // Not a schema object
      T extends ReadonlyArray<unknown>
      ? never
      : // Object of unknown shape
        T extends object
        ? JSONSchemaNotCollectionFragment
        : never;

// #endregion
