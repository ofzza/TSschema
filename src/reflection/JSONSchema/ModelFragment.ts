/**
 * Nodes of JSON schema model fragments (`type: "object"` with `properties`): property names, the nodes of each property and the required
 * property names.
 */

import type {
  JSONSchema7,
  JSONSchemaCollection,
  JSONSchemaFragmentName,
  JSONSchemaFragmentPropertyName,
  JSONSchemaModelFragment,
} from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentNode, type JSONSchemaFragmentNodeOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentNodes, type JSONSchemaNestedFragmentNodes } from './FragmentNodes.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Parses a JSON schema model definition, which is any object schema fragment containing `properties`. Parses each property's fragment on
 * construction.
 */
export class JSONSchemaModelFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentNode<TSchema, TName, TFragment> {
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
   * Nodes of each property's fragment, by property name
   */
  public readonly properties: _JSONSchemaModelFragmentPropertiesNodes<TSchema, TFragment>;

  /**
   * Names of the model's required properties, as listed by its `required` keyword (names of properties the model does not define are left out). The
   * value type inferred by the type layer (see `Type`) makes these properties required, and all other properties optional.
   */
  public readonly required: Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;

  /**
   * Parses a JSON schema model definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentNodeOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    this.names = Object.keys(fragment['properties']) as Array<JSONSchemaFragmentPropertyName<TFragment>>;
    this.properties = Object.fromEntries(
      Object.entries(fragment['properties']).map(([name, property]) => [name, createJSONSchemaNestedFragmentNodes(property, this._context)]),
    ) as _JSONSchemaModelFragmentPropertiesNodes<TSchema, TFragment>;
    const required = fragment['required'];
    this.required = (
      required instanceof Array ? required.filter((name) => typeof name === 'string' && (this.names as Array<string>).includes(name)) : []
    ) as Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`
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
 * Infers the nodes of each of a model fragment's properties, by property name. Every property is required and mutable, regardless of the modifiers
 * the schema's own `properties` object was declared with.
 */
type _JSONSchemaModelFragmentPropertiesNodes<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaModelFragment> = {
  -readonly [K in keyof TFragment['properties']]-?: JSONSchemaNestedFragmentNodes<TSchema, Exclude<TFragment['properties'][K], undefined>>;
};
