/**
 * Reflection of JSON schema `type: "null"` fragments.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNullTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';

/**
 * Reflects a JSON schema null type definition, which is any schema fragment containing a `type="null"` property.
 */
export class JSONSchemaNullTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNullTypeFragment = JSONSchemaNullTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
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
   * Reflects a JSON schema null type definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
  }
}
