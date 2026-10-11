/**
 * Reflection of JSON schema `const` fragments: the constant value.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaConstFragment, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Reflects a JSON schema const definition, which is any schema fragment containing a `const` property.
 */
export class JSONSchemaConstFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaConstFragment = JSONSchemaConstFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a const definition (i.e., contains a `const` property, of any value). The runtime counterpart of
   * `JSONSchemaFragmentIsConst`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a const definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaConstFragment {
    return isJSONSchemaObject(fragment) && 'const' in fragment;
  }

  /**
   * The constant value, as declared
   */
  public readonly const: TFragment['const'];

  /**
   * Reflects a JSON schema const definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.const = _fragment['const'];
  }
}
