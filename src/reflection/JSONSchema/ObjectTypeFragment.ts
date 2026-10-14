/**
 * Facets of JSON schema `type: "object"` fragments without `properties`: the validation keywords applying to objects.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaDefinitionName, JSONSchemaObjectTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { getJSONSchemaKeyword, type JSONSchemaKeyword } from './JSONSchema7.js';

/**
 * Parses a JSON schema object type definition, which is any schema fragment containing a `type="object"` property and no `properties` property (one
 * with `properties` is a model, see `JSONSchemaModelFragmentFacet`).
 */
export class JSONSchemaObjectTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an object type definition (i.e., contains a `type="object"` property and no `properties` property). The
   * runtime counterpart of `JSONSchemaFragmentIsObjectType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an object type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaObjectTypeFragment {
    return fragment?.type === 'object' && fragment?.['properties'] === undefined;
  }

  /**
   * The fragment's `type`, always `"object"`
   */
  public readonly type: TFragment['type'];

  /**
   * The fragment's `minProperties` (the minimum number of properties), or `undefined` if it has none
   */
  public readonly minProperties: JSONSchemaKeyword<TFragment, 'minProperties', number>;

  /**
   * The fragment's `maxProperties` (the maximum number of properties), or `undefined` if it has none
   */
  public readonly maxProperties: JSONSchemaKeyword<TFragment, 'maxProperties', number>;

  /**
   * The fragment's `format` (a custom format, as JSON Schema predefines string formats only), or `undefined` if it has none
   */
  public readonly format: JSONSchemaKeyword<TFragment, 'format', string>;

  /**
   * Parses a JSON schema object type definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    this.minProperties = getJSONSchemaKeyword(fragment, 'minProperties', 'number') as JSONSchemaKeyword<TFragment, 'minProperties', number>;
    this.maxProperties = getJSONSchemaKeyword(fragment, 'maxProperties', 'number') as JSONSchemaKeyword<TFragment, 'maxProperties', number>;
    this.format = getJSONSchemaKeyword(fragment, 'format', 'string') as JSONSchemaKeyword<TFragment, 'format', string>;
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `required`
}
