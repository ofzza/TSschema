/**
 * Reflection of JSON schema `type: "object"` fragments without `properties`.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaObjectTypeFragment } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';

/**
 * Reflects a JSON schema object type definition, which is any schema fragment containing a `type="object"` property and no `properties` property (one
 * with `properties` is a model, see `JSONSchemaModelFragmentReflect`).
 */
export class JSONSchemaObjectTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an object type definition (i.e., contains a `type="object"` property and no `properties` property). The
   * runtime counterpart of `JSONSchemaFragmentIsObjectType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an object type definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaObjectTypeFragment {
    return fragment?.type === 'object' && fragment?.['properties'] === undefined;
  }

  /**
   * The fragment's `type`, always `"object"`
   */
  public readonly type: TFragment['type'];

  /**
   * Reflects a JSON schema object type definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`,
  //       `required`
}
