/**
 * Facets of JSON schema `const` fragments: the constant value.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaConstFragment, JSONSchemaDefinitionName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Parses a JSON schema const definition, which is any schema fragment containing a `const` property.
 */
export class JSONSchemaConstFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaConstFragment = JSONSchemaConstFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a const definition (i.e., contains a `const` property, of any value). The runtime counterpart of
   * `JSONSchemaFragmentIsConst`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a const definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaConstFragment {
    return isJSONSchemaObject(fragment) && 'const' in fragment;
  }

  /**
   * The constant value, as declared
   */
  public readonly const: TFragment['const'];

  /**
   * Parses a JSON schema const definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.const = fragment['const'];
  }
}
