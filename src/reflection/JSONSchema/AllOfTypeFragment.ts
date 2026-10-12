/**
 * Reflection of JSON schema `allOf` fragments: the reflections of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaAllOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentsReflections } from './FragmentReflections.js';

/**
 * Reflects a JSON schema all-of-types definition, which is any schema fragment containing an `allOf` property. Reflects each listed fragment on construction.
 */
export class JSONSchemaAllOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an all-of-types definition (i.e., contains an `allOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsAllOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an all-of-types definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaAllOfTypeFragment {
    return fragment?.['allOf'] instanceof Array;
  }

  /**
   * Reflections of each `allOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no reflections.
   */
  public readonly allOf: JSONSchemaNestedFragmentsReflections<TSchema, TFragment['allOf']>;

  /**
   * Reflects a JSON schema all-of-types definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema> | undefined, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.allOf = _fragment['allOf'].map((fragment) => createJSONSchemaNestedFragmentReflections(_schema, fragment)) as JSONSchemaNestedFragmentsReflections<
      TSchema,
      TFragment['allOf']
    >;
  }
}
