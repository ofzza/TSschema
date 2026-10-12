/**
 * Reflection of JSON schema `type: "array"` fragments: the reflections of their `items` fragment.
 */

import type { JSONSchema7, JSONSchemaArrayTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentReflect, type JSONSchemaFragmentReflectOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentReflections, type JSONSchemaNestedFragmentReflections } from './FragmentReflections.js';

/**
 * Reflects a JSON schema array type definition, which is any schema fragment containing a `type="array"` property and an optional `items` property.
 * Reflects the `items` fragment on construction.
 */
export class JSONSchemaArrayTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaArrayTypeFragment = JSONSchemaArrayTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an array type definition (i.e., contains a `type="array"` property). The runtime counterpart of
   * `JSONSchemaFragmentIsArrayType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an array type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaArrayTypeFragment {
    return fragment?.type === 'array';
  }

  /**
   * The fragment's `type`, always `"array"`
   */
  public readonly type: TFragment['type'];

  /**
   * Reflections of the `items` fragment, or `undefined` if there is none. An `items` which is not a single schema object (a boolean schema, or a tuple's
   * array of schemas) has no reflections. Built eagerly on construction, unlike a reference fragment's `ref`, as the `items` fragment is nested in, and
   * owned by, this fragment, so reflecting it can not recurse back into this fragment
   */
  public readonly items: _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;

  /**
   * Reflects a JSON schema array type definition
   * @param fragment JSON fragment to reflect on
   * @param options Context and name of the reflected fragment (see `JSONSchemaFragmentReflectOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentReflectOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    const items = fragment['items'];
    this.items = (
      items === undefined ? undefined : createJSONSchemaNestedFragmentReflections(items, this._context)
    ) as _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;
  }

  // TODO: Not implemented yet (as in the type layer): tuples, i.e. `prefixItems` (or an `items` array, with `additionalItems`). Planned as a separate
  //       `prefixItems` property, holding the reflections of each position's fragment, while `items` keeps reflecting the fragment of every other item
}

/**
 * Infers the reflections of an array type fragment's `items` fragment, or `undefined` if it has none
 */
type _JSONSchemaArrayTypeFragmentItemsReflect<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaArrayTypeFragment> =
  // Items keyword known
  'items' extends keyof TFragment
    ? // Items defined
      TFragment extends { items: infer I }
      ? JSONSchemaNestedFragmentReflections<TSchema, I>
      : // Items possibly defined
        TFragment extends { items?: infer I }
        ? JSONSchemaNestedFragmentReflections<TSchema, Exclude<I, undefined>> | undefined
        : undefined
    : // No items
      undefined;
