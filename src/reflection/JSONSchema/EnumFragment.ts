/**
 * Reflection of JSON schema `enum` fragments: the enumerated values.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaEnumFragment, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';

/**
 * Reflects a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export class JSONSchemaEnumFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaEnumFragment = JSONSchemaEnumFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an enum definition (i.e., contains an `enum` array). The runtime counterpart of `JSONSchemaFragmentIsEnum`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an enum definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaEnumFragment {
    return fragment?.['enum'] instanceof Array;
  }

  /**
   * The enumerated values, as declared
   */
  public readonly enum: TFragment['enum'];

  /**
   * Reflects a JSON schema enum definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema> | undefined, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.enum = _fragment['enum'];
  }
}
