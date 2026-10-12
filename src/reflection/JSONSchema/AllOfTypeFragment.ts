/**
 * Reflection of JSON schema `allOf` fragments: the reflections of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaAllOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentsReflections } from './FragmentReflections.js';

/**
 * Reflects a JSON schema all-of-types definition, which is any schema fragment containing an `allOf` property. Reflects each listed fragment on construction.
 */
export class JSONSchemaAllOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an all-of-types definition (i.e., contains an `allOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsAllOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an all-of-types definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaAllOfTypeFragment {
    return fragment?.['allOf'] instanceof Array;
  }

  /**
   * Reflections of each `allOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no reflections.
   */
  public readonly allOf: JSONSchemaNestedFragmentsReflections<TSchema, TFragment['allOf']>;

  /**
   * Reflects a JSON schema all-of-types definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.allOf = fragment['allOf'].map((member) => createJSONSchemaNestedFragmentReflections(member, this._context)) as JSONSchemaNestedFragmentsReflections<
      TSchema,
      TFragment['allOf']
    >;
  }
}
