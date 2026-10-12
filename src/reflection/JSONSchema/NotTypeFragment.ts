/**
 * Reflection of JSON schema `not` fragments: the reflections of the negated fragment.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentReflections } from './FragmentReflections.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Reflects a JSON schema not-type definition, which is any schema fragment containing a `not` property. Reflects the negated fragment on construction.
 */
export class JSONSchemaNotTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a not-type definition (i.e., contains a `not` schema object). The runtime counterpart of
   * `JSONSchemaFragmentIsNotType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a not-type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaNotTypeFragment {
    return isJSONSchemaObject(fragment?.['not']);
  }

  /**
   * Reflections of the `not` fragment
   */
  public readonly not: JSONSchemaNestedFragmentReflections<TSchema, TFragment['not']>;

  /**
   * Reflects a JSON schema not-type definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.not = createJSONSchemaNestedFragmentReflections(fragment['not'], this._context) as JSONSchemaNestedFragmentReflections<TSchema, TFragment['not']>;
  }
}
