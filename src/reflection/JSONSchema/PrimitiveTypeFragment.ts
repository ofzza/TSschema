/**
 * Reflection of JSON schema primitive `type` fragments (`string`, `number`, `integer`, `boolean`; `null` has a fragment reflection of its own): the
 * primitive type name(s).
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaPrimitiveTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { isJSONSchemaPrimitiveTypeName } from './JSONSchema7.js';

/**
 * Reflects a JSON schema primitive type definition, which is any schema fragment containing a `type` property naming a primitive type, or an array of
 * primitive type names.
 */
export class JSONSchemaPrimitiveTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaPrimitiveTypeFragment = JSONSchemaPrimitiveTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property naming a primitive type, or an array of
   * primitive type names only). The runtime counterpart of `JSONSchemaFragmentIsPrimitiveType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a primitive type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaPrimitiveTypeFragment {
    const type = fragment?.type;
    return type instanceof Array ? type.every((name) => isJSONSchemaPrimitiveTypeName(name)) : isJSONSchemaPrimitiveTypeName(type);
  }

  /**
   * The fragment's `type`: a primitive type name, or an array of primitive type names
   */
  public readonly type: TFragment['type'];

  /**
   * Reflects a JSON schema primitive type definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
  }
}
