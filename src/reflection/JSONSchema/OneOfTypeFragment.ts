/**
 * Facets of JSON schema `oneOf` fragments: the facets of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaOneOfTypeFragment, JSONSchemaCollection, JSONSchemaDefinitionName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentFacets, type JSONSchemaNestedFragmentsFacets } from './FragmentFacets.js';

/**
 * Parses a JSON schema one-of-types definition, which is any schema fragment containing a `oneOf` property. Parses each listed fragment on construction.
 */
export class JSONSchemaOneOfTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a one-of-types definition (i.e., contains a `oneOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsOneOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a one-of-types definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaOneOfTypeFragment {
    return fragment?.['oneOf'] instanceof Array;
  }

  /**
   * Facets of each `oneOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no facets.
   */
  public readonly oneOf: JSONSchemaNestedFragmentsFacets<TSchema, TFragment['oneOf']>;

  /**
   * Parses a JSON schema one-of-types definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.oneOf = fragment['oneOf'].map((member) => createJSONSchemaNestedFragmentFacets(member, this._collection)) as JSONSchemaNestedFragmentsFacets<
      TSchema,
      TFragment['oneOf']
    >;
  }
}
