/**
 * Reflection of JSON schema `oneOf` fragments: the reflections of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaOneOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentsReflections } from './FragmentReflections.js';

/**
 * Reflects a JSON schema one-of-types definition, which is any schema fragment containing a `oneOf` property. Reflects each listed fragment on construction.
 */
export class JSONSchemaOneOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a one-of-types definition (i.e., contains a `oneOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsOneOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a one-of-types definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaOneOfTypeFragment {
    return fragment?.['oneOf'] instanceof Array;
  }

  /**
   * Reflections of each `oneOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no reflections.
   */
  public readonly oneOf: JSONSchemaNestedFragmentsReflections<TSchema, TFragment['oneOf']>;

  /**
   * Reflects a JSON schema one-of-types definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.oneOf = fragment['oneOf'].map((member) => createJSONSchemaNestedFragmentReflections(member, this._context)) as JSONSchemaNestedFragmentsReflections<
      TSchema,
      TFragment['oneOf']
    >;
  }
}
