/**
 * Reflection of JSON schema `not` fragments: the reflections of the negated fragment.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotTypeFragment } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentReflections } from './FragmentReflections.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Reflects a JSON schema not-type definition, which is any schema fragment containing a `not` property. Reflects the negated fragment on construction.
 */
export class JSONSchemaNotTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a not-type definition (i.e., contains a `not` schema object). The runtime counterpart of
   * `JSONSchemaFragmentIsNotType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a not-type definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaNotTypeFragment {
    return isJSONSchemaObject(fragment?.['not']);
  }

  /**
   * Reflections of the `not` fragment
   */
  public readonly not: JSONSchemaNestedFragmentReflections<TSchema, TFragment['not']>;

  /**
   * Reflects a JSON schema not-type definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema> | undefined, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.not = createJSONSchemaNestedFragmentReflections(_schema, _fragment['not']) as JSONSchemaNestedFragmentReflections<TSchema, TFragment['not']>;
  }
}
