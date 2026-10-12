/**
 * Nodes of JSON schema `not` fragments: the nodes of the negated fragment.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentNode, type JSONSchemaFragmentNodeOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentNodes, type JSONSchemaNestedFragmentNodes } from './FragmentNodes.js';
import { isJSONSchemaObject } from './JSONSchema7.js';

/**
 * Parses a JSON schema not-type definition, which is any schema fragment containing a `not` property. Parses the negated fragment on construction.
 */
export class JSONSchemaNotTypeFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentNode<TSchema, TName, TFragment> {
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
   * Nodes of the `not` fragment
   */
  public readonly not: JSONSchemaNestedFragmentNodes<TSchema, TFragment['not']>;

  /**
   * Parses a JSON schema not-type definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentNodeOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.not = createJSONSchemaNestedFragmentNodes(fragment['not'], this._context) as JSONSchemaNestedFragmentNodes<TSchema, TFragment['not']>;
  }
}
