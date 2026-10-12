/**
 * Facets of JSON schema `$ref` fragments: the name of the referenced fragment, and its facets, resolved lazily against the collection.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaReferenceFragment } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionParsedFragment } from './CollectionFragment.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import type { JSONSchemaFragmentFacetOf } from './FragmentFacets.js';

/**
 * Parses a JSON schema reference definition, which is any schema fragment containing a `$ref` property.
 */
export class JSONSchemaReferenceFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaReferenceFragment = JSONSchemaReferenceFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a reference definition (i.e., contains a `$ref` string). The runtime counterpart of
   * `JSONSchemaFragmentIsReference`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a reference definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaReferenceFragment {
    return typeof fragment?.['$ref'] === 'string';
  }

  /**
   * Name of the referenced fragment, parsed from a `#/$defs/<name>` reference, or `undefined` if the reference is of any other form, names no fragment
   * of the collection, or the parsed schema has no `$defs` to resolve it against. JSON pointers are not supported (yet), as in the type layer: a
   * reference is not unescaped (`~0`, `~1`) or percent-decoded, and can not point anywhere but directly into `$defs`.
   */
  public readonly refName: _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>;

  /**
   * Facets of the referenced fragment, as held by the collection, or `undefined` if the reference can not be resolved. Resolved lazily on access,
   * unlike an array type fragment's `items`: the referenced fragment is shared, not owned by this fragment, and (in)directly recursive references would
   * never finish constructing if resolved eagerly. Besides, the collection's facets are not available yet while it is still constructing them.
   */
  public get ref(): _JSONSchemaReferenceFragmentRefFacets<TSchema, _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>> {
    return (
      this.refName === undefined ? undefined : this._context?.$defs[this.refName as JSONSchemaFragmentName<TSchema>]
    ) as _JSONSchemaReferenceFragmentRefFacets<TSchema, _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>>;
  }

  /**
   * Parses a JSON schema reference definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    const name = /^#\/\$defs\/(.+)$/.exec(fragment['$ref'])?.[1];
    this.refName = (
      name !== undefined && (this._context?.names as Array<string> | undefined)?.includes(name) ? name : undefined
    ) as _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>;
  }
}

/**
 * Infers the name of the fragment referenced by a reference fragment, parsed from a `#/$defs/<name>` reference. A reference of any other form, or one
 * naming no fragment of the collection, infers `undefined`; an unspecified (`string`) reference infers any fragment name or `undefined`.
 */
type _JSONSchemaReferenceFragmentRefName<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaReferenceFragment> =
  // Unspecified reference
  string extends TFragment['$ref']
    ? JSONSchemaFragmentName<TSchema> | undefined
    : // Reference to a fragment of the collection
      TFragment['$ref'] extends `#/$defs/${infer N}`
      ? N extends JSONSchemaFragmentName<TSchema>
        ? N
        : undefined
      : // Any other reference
        undefined;

/**
 * Infers the facets of the fragment(s) referenced by name, distributing over a union of names, or `undefined` for an unresolved reference
 */
type _JSONSchemaReferenceFragmentRefFacets<TSchema extends JSONSchemaCollection, TRefName> =
  // Resolved reference
  TRefName extends JSONSchemaFragmentName<TSchema>
    ? Array<JSONSchemaFragmentFacetOf<TSchema, TRefName, JSONSchemaCollectionParsedFragment<TSchema, TRefName>>>
    : // Unresolved reference
      undefined;
