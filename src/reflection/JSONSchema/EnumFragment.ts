/**
 * Facets of JSON schema `enum` fragments: the enumerated values, and their names.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaEnumFragment, JSONSchemaDefinitionName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { getJSONSchemaValueName, type JSONSchemaValueName } from './JSONSchema7.js';

/**
 * Parses a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export class JSONSchemaEnumFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
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
   * Names of the enumerated values, in the same order: the `x-enumNames` vendor keyword if it lists a string per value, otherwise each value's own name
   * (see `getJSONSchemaValueName`)
   */
  public readonly names: _JSONSchemaEnumFragmentNames<TFragment>;

  /**
   * Parses a JSON schema enum definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.enum = fragment['enum'];
    const names = (fragment as { 'x-enumNames'?: unknown })['x-enumNames'];
    this.names = (
      names instanceof Array && names.length === fragment['enum'].length && names.every((name) => typeof name === 'string')
        ? [...names]
        : fragment['enum'].map((value) => getJSONSchemaValueName(value))
    ) as _JSONSchemaEnumFragmentNames<TFragment>;
  }
}

/**
 * Infers the names of an enum fragment's values: its `x-enumNames` if it is a list of strings as long as `enum`, otherwise each value's own name (see
 * `JSONSchemaValueName`), element by element for a tuple
 */
type _JSONSchemaEnumFragmentNames<TFragment extends JSONSchemaEnumFragment> =
  // Names listed, one per value
  TFragment extends { 'x-enumNames': infer N extends ReadonlyArray<string> }
    ? N['length'] extends TFragment['enum']['length']
      ? TFragment['enum']['length'] extends N['length']
        ? { -readonly [I in keyof N]: N[I] }
        : _JSONSchemaEnumFragmentValueNames<TFragment['enum']>
      : _JSONSchemaEnumFragmentValueNames<TFragment['enum']>
    : // No names listed
      _JSONSchemaEnumFragmentValueNames<TFragment['enum']>;

/**
 * Infers the own name of each enumerated value, element by element for a tuple
 */
type _JSONSchemaEnumFragmentValueNames<TValues extends ReadonlyArray<unknown>> = { -readonly [I in keyof TValues]: JSONSchemaValueName<TValues[I]> };
