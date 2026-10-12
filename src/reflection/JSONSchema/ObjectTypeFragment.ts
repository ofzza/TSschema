/**
 * Reflection of JSON schema `type: "object"` fragments without `properties`.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaObjectTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';

/**
 * Reflects a JSON schema object type definition, which is any schema fragment containing a `type="object"` property and no `properties` property (one
 * with `properties` is a model, see `JSONSchemaModelFragmentReflect`).
 */
export class JSONSchemaObjectTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
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
   * Reflects a JSON schema object type definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`,
  //       `required`
}
