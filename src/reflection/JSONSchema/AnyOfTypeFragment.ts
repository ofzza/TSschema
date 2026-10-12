/**
 * Facets of JSON schema `anyOf` fragments: the facets of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaAnyOfTypeFragment, JSONSchemaCollection, JSONSchemaDefinitionName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentFacets, type JSONSchemaNestedFragmentsFacets } from './FragmentFacets.js';

/**
 * Parses a JSON schema any-of-types definition, which is any schema fragment containing an `anyOf` property. Parses each listed fragment on construction.
 */
export class JSONSchemaAnyOfTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an any-of-types definition (i.e., contains an `anyOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsAnyOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an any-of-types definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaAnyOfTypeFragment {
    return fragment?.['anyOf'] instanceof Array;
  }

  /**
   * Facets of each `anyOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no facets.
   */
  public readonly anyOf: JSONSchemaNestedFragmentsFacets<TSchema, TFragment['anyOf']>;

  /**
   * Whether this is the facet of an implicit `anyOf`, built by the router from the branches of a `type` array (see `createJSONSchemaFragmentFacets`), rather
   * than an `anyOf` keyword of the fragment itself. The `fragment` of an implicit `anyOf` is the generated `anyOf` fragment, not the fragment it was
   * built from.
   */
  public readonly implicit: boolean;

  /**
   * Parses a JSON schema any-of-types definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`), and whether it is an `implicit` `anyOf`, generated
   * from the branches of a `type` array
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> & { implicit?: boolean } = {}) {
    super(fragment, options);
    this.anyOf = fragment['anyOf'].map((member) => createJSONSchemaNestedFragmentFacets(member, this._collection)) as JSONSchemaNestedFragmentsFacets<
      TSchema,
      TFragment['anyOf']
    >;
    this.implicit = options.implicit ?? false;
  }
}
