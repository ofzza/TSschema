/**
 * Reflection of JSON schema model fragments (`type: "object"` with `properties`): property names, the reflections of each property and the required
 * property names.
 */

import type {
  JSONSchema7,
  JSONSchemaCollection,
  JSONSchemaFragmentName,
  JSONSchemaFragmentPropertyName,
  JSONSchemaModelFragment,
} from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentReflections } from './FragmentReflections.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Reflects a JSON schema model definition, which is any object schema fragment containing `properties`. Reflects each property's fragment on
 * construction.
 */
export class JSONSchemaModelFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
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
   * Reflections of each property's fragment, by property name
   */
  public readonly properties: _JSONSchemaModelFragmentPropertiesReflect<TSchema, TFragment>;

  /**
   * Names of the model's required properties, as listed by its `required` keyword (names of properties the model does not define are left out). The
   * value type inferred by the type layer (see `Type`) makes these properties required, and all other properties optional.
   */
  public readonly required: Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;

  /**
   * Reflects a JSON schema model definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    this.names = Object.keys(fragment['properties']) as Array<JSONSchemaFragmentPropertyName<TFragment>>;
    this.properties = Object.fromEntries(
      Object.entries(fragment['properties']).map(([name, property]) => [name, createJSONSchemaNestedFragmentReflections(property, this._context)]),
    ) as _JSONSchemaModelFragmentPropertiesReflect<TSchema, TFragment>;
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
 * Infers the reflections of each of a model fragment's properties, by property name. Every property is required and mutable, regardless of the modifiers
 * the schema's own `properties` object was declared with.
 */
type _JSONSchemaModelFragmentPropertiesReflect<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaModelFragment> = {
  -readonly [K in keyof TFragment['properties']]-?: JSONSchemaNestedFragmentReflections<TSchema, Exclude<TFragment['properties'][K], undefined>>;
};
