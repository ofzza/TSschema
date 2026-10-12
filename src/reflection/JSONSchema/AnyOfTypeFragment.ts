/**
 * Reflection of JSON schema `anyOf` fragments: the reflections of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaAnyOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentsReflections } from './FragmentReflections.js';

/**
 * Reflects a JSON schema any-of-types definition, which is any schema fragment containing an `anyOf` property. Reflects each listed fragment on construction.
 */
export class JSONSchemaAnyOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an any-of-types definition (i.e., contains an `anyOf` array). The runtime counterpart of
   * `JSONSchemaFragmentIsAnyOfType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an any-of-types definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaAnyOfTypeFragment {
    return fragment?.['anyOf'] instanceof Array;
  }

  /**
   * Reflections of each `anyOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no reflections.
   */
  public readonly anyOf: JSONSchemaNestedFragmentsReflections<TSchema, TFragment['anyOf']>;

  /**
   * Whether this reflects an implicit `anyOf`, built by the router from the branches of a `type` array (see `createJSONSchemaFragmentReflections`), rather
   * than an `anyOf` keyword of the fragment itself. The `fragment` of an implicit `anyOf` is the generated `anyOf` fragment, not the fragment it was
   * built from.
   */
  public readonly implicit: boolean;

  /**
   * Reflects a JSON schema any-of-types definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`), and whether it is an `implicit` `anyOf`, generated
   * from the branches of a `type` array
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> & { implicit?: boolean } = {}) {
    super(fragment, options);
    this.anyOf = fragment['anyOf'].map((member) => createJSONSchemaNestedFragmentReflections(member, this._context)) as JSONSchemaNestedFragmentsReflections<
      TSchema,
      TFragment['anyOf']
    >;
    this.implicit = options.implicit ?? false;
  }
}
