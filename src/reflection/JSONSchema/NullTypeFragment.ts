/**
 * Reflection of JSON schema `type: "null"` fragments.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNullTypeFragment } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';

/**
 * Reflects a JSON schema null type definition, which is any schema fragment containing a `type="null"` property.
 */
export class JSONSchemaNullTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNullTypeFragment = JSONSchemaNullTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a null type definition (i.e., contains a `type="null"` property). The runtime counterpart of
   * `JSONSchemaFragmentIsNullType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a null type definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaNullTypeFragment {
    return fragment?.type === 'null';
  }

  /**
   * The fragment's `type`, always `"null"`
   */
  public readonly type: TFragment['type'];

  /**
   * Reflects a JSON schema null type definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
  }
}
