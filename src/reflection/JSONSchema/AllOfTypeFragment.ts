/**
 * Facets of JSON schema `allOf` fragments: the facets of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaAllOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentFacets, type JSONSchemaNestedFragmentsFacets } from './FragmentFacets.js';

/**
 * Parses a JSON schema all-of-types definition, which is any schema fragment containing an `allOf` property. Parses each listed fragment on construction.
 */
export class JSONSchemaAllOfTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an all-of-types definition (i.e., contains an `allOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsAllOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an all-of-types definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaAllOfTypeFragment {
    return fragment?.['allOf'] instanceof Array;
  }

  /**
   * Facets of each `allOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no facets.
   */
  public readonly allOf: JSONSchemaNestedFragmentsFacets<TSchema, TFragment['allOf']>;

  /**
   * Parses a JSON schema all-of-types definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.allOf = fragment['allOf'].map((member) => createJSONSchemaNestedFragmentFacets(member, this._context)) as JSONSchemaNestedFragmentsFacets<
      TSchema,
      TFragment['allOf']
    >;
  }
}
