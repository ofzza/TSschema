/**
 * Facets of JSON schema model fragments (`type: "object"` with `properties`): property names, the facets of each property and the required
 * property names, and the validation keywords applying to objects.
 */

import type {
  JSONSchema7,
  JSONSchemaCollection,
  JSONSchemaDefinitionName,
  JSONSchemaFragmentPropertyName,
  JSONSchemaModelFragment,
} from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentFacets, type JSONSchemaNestedFragmentFacets } from './FragmentFacets.js';
import { getJSONSchemaKeyword, isJSONSchemaObject, type JSONSchemaKeyword } from './JSONSchema7.js';

/**
 * Parses a JSON schema model definition, which is any object schema fragment containing `properties`. Parses each property's fragment on
 * construction.
 */
export class JSONSchemaModelFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a model definition (i.e., an object with `properties`). The runtime counterpart of
   * `JSONSchemaFragmentIsModel`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a model definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaModelFragment {
    return fragment?.type === 'object' && isJSONSchemaObject(fragment?.['properties']);
  }

  /**
   * The fragment's `type`, always `"object"`
   */
  public readonly type: TFragment['type'];

  /**
   * Names of all the model's properties
   */
  public readonly names: Array<JSONSchemaFragmentPropertyName<TFragment>>;

  /**
   * Facets of each property's fragment, by property name
   */
  public readonly properties: _JSONSchemaModelFragmentPropertiesFacets<TSchema, TFragment>;

  /**
   * Names of the model's required properties, as listed by its `required` keyword (names of properties the model does not define are left out). The
   * value type inferred by the type layer (see `Type`) makes these properties required, and all other properties optional.
   */
  public readonly required: Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;

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
   * Parses a JSON schema model definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    this.names = Object.keys(fragment['properties']) as Array<JSONSchemaFragmentPropertyName<TFragment>>;
    this.properties = Object.fromEntries(
      Object.entries(fragment['properties']).map(([name, property]) => [name, createJSONSchemaNestedFragmentFacets(property, this._collection)]),
    ) as _JSONSchemaModelFragmentPropertiesFacets<TSchema, TFragment>;
    const required = fragment['required'];
    this.required = (
      required instanceof Array ? required.filter((name) => typeof name === 'string' && (this.names as Array<string>).includes(name)) : []
    ) as Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;
    this.minProperties = getJSONSchemaKeyword(fragment, 'minProperties', 'number') as JSONSchemaKeyword<TFragment, 'minProperties', number>;
    this.maxProperties = getJSONSchemaKeyword(fragment, 'maxProperties', 'number') as JSONSchemaKeyword<TFragment, 'maxProperties', number>;
    this.format = getJSONSchemaKeyword(fragment, 'format', 'string') as JSONSchemaKeyword<TFragment, 'format', string>;
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`
}

/**
 * Infers the names of a model fragment's required properties, as listed by its `required` keyword and defined by the model. A model with no `required`
 * infers `never`.
 */
type _JSONSchemaModelFragmentRequiredName<TFragment extends JSONSchemaModelFragment> =
  // Required property names listed
  TFragment extends { required?: infer R }
    ? Exclude<R, undefined> extends infer Q extends ReadonlyArray<unknown>
      ? Extract<Q[number], JSONSchemaFragmentPropertyName<TFragment>>
      : never
    : // No required property names
      never;

/**
 * Infers the facets of each of a model fragment's properties, by property name. Every property is required and mutable, regardless of the modifiers
 * the schema's own `properties` object was declared with.
 */
type _JSONSchemaModelFragmentPropertiesFacets<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaModelFragment> = {
  -readonly [K in keyof TFragment['properties']]-?: JSONSchemaNestedFragmentFacets<TSchema, Exclude<TFragment['properties'][K], undefined>>;
};
