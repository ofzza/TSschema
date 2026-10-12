/**
 * Facets of JSON schema `type: "null"` fragments.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaDefinitionName, JSONSchemaNullTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';

/**
 * Parses a JSON schema null type definition, which is any schema fragment containing a `type="null"` property.
 */
export class JSONSchemaNullTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaNullTypeFragment = JSONSchemaNullTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a null type definition (i.e., contains a `type="null"` property). The runtime counterpart of
   * `JSONSchemaFragmentIsNullType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a null type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaNullTypeFragment {
    return fragment?.type === 'null';
  }

  /**
   * The fragment's `type`, always `"null"`
   */
  public readonly type: TFragment['type'];

  /**
   * Parses a JSON schema null type definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
  }
}
