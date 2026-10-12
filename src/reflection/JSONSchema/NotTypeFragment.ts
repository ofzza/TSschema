/**
 * Facets of JSON schema `not` fragments: the facets of the negated fragment.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaDefinitionName, JSONSchemaNotTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentFacets, type JSONSchemaNestedFragmentFacets } from './FragmentFacets.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Parses a JSON schema not-type definition, which is any schema fragment containing a `not` property. Parses the negated fragment on construction.
 */
export class JSONSchemaNotTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a not-type definition (i.e., contains a `not` schema object). The runtime counterpart of
   * `JSONSchemaFragmentIsNotType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a not-type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaNotTypeFragment {
    return isJSONSchemaObject(fragment?.['not']);
  }

  /**
   * Facets of the `not` fragment
   */
  public readonly not: JSONSchemaNestedFragmentFacets<TSchema, TFragment['not']>;

  /**
   * Parses a JSON schema not-type definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.not = createJSONSchemaNestedFragmentFacets(fragment['not'], this._collection) as JSONSchemaNestedFragmentFacets<TSchema, TFragment['not']>;
  }
}
