/**
 * Nodes of JSON schema `type: "array"` fragments: the nodes of their `items` fragment.
 */

import type { JSONSchema7, JSONSchemaArrayTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentNode, type JSONSchemaFragmentNodeOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentNodes, type JSONSchemaNestedFragmentNodes } from './FragmentNodes.js';

/**
 * Parses a JSON schema array type definition, which is any schema fragment containing a `type="array"` property and an optional `items` property.
 * Parses the `items` fragment on construction.
 */
export class JSONSchemaArrayTypeFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaArrayTypeFragment = JSONSchemaArrayTypeFragment,
> extends JSONSchemaFragmentNode<TSchema, TName, TFragment> {
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
   * Nodes of the `items` fragment, or `undefined` if there is none. An `items` which is not a single schema object (a boolean schema, or a tuple's
   * array of schemas) has no nodes. Built eagerly on construction, unlike a reference fragment's `ref`, as the `items` fragment is nested in, and
   * owned by, this fragment, so parsing it can not recurse back into this fragment
   */
  public readonly items: _JSONSchemaArrayTypeFragmentItemsNodes<TSchema, TFragment>;

  /**
   * Parses a JSON schema array type definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentNodeOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    const items = fragment['items'];
    this.items = (items === undefined ? undefined : createJSONSchemaNestedFragmentNodes(items, this._context)) as _JSONSchemaArrayTypeFragmentItemsNodes<
      TSchema,
      TFragment
    >;
  }

  // TODO: Not implemented yet (as in the type layer): tuples, i.e. `prefixItems` (or an `items` array, with `additionalItems`). Planned as a separate
  //       `prefixItems` property, holding the nodes of each position's fragment, while `items` keeps parsing the fragment of every other item
}

/**
 * Infers the nodes of an array type fragment's `items` fragment, or `undefined` if it has none
 */
type _JSONSchemaArrayTypeFragmentItemsNodes<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaArrayTypeFragment> =
  // Items keyword known
  'items' extends keyof TFragment
    ? // Items defined
      TFragment extends { items: infer I }
      ? JSONSchemaNestedFragmentNodes<TSchema, I>
      : // Items possibly defined
        TFragment extends { items?: infer I }
        ? JSONSchemaNestedFragmentNodes<TSchema, Exclude<I, undefined>> | undefined
        : undefined
    : // No items
      undefined;
