/**
 * Facets of JSON schema `enum` fragments: the enumerated values.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaEnumFragment, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';

/**
 * Parses a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export class JSONSchemaEnumFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaEnumFragment = JSONSchemaEnumFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an enum definition (i.e., contains an `enum` array). The runtime counterpart of `JSONSchemaFragmentIsEnum`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an enum definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaEnumFragment {
    return fragment?.['enum'] instanceof Array;
  }

  /**
   * The enumerated values, as declared
   */
  public readonly enum: TFragment['enum'];

  /**
   * Parses a JSON schema enum definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.enum = fragment['enum'];
  }
}
