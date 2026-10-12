/**
 * Reflection of JSON schema primitive `type` fragments (`string`, `number`, `integer`, `boolean`; `null` has a fragment reflection of its own): the
 * primitive type name(s).
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaPrimitiveTypeFragment } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';
import { isJSONSchemaPrimitiveTypeName } from './JSONSchema7.js';

/**
 * Reflects a JSON schema primitive type definition, which is any schema fragment containing a `type` property naming a primitive type, or an array of
 * primitive type names.
 */
export class JSONSchemaPrimitiveTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaPrimitiveTypeFragment = JSONSchemaPrimitiveTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property naming a primitive type, or an array of
   * primitive type names only). The runtime counterpart of `JSONSchemaFragmentIsPrimitiveType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a primitive type definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaPrimitiveTypeFragment {
    const type = fragment?.type;
    return type instanceof Array ? type.every((name) => isJSONSchemaPrimitiveTypeName(name)) : isJSONSchemaPrimitiveTypeName(type);
  }

  /**
   * The fragment's `type`: a primitive type name, or an array of primitive type names
   */
  public readonly type: TFragment['type'];

  /**
   * Reflects a JSON schema primitive type definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema> | undefined, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
  }
}
