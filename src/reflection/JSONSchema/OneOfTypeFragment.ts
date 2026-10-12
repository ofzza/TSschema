/**
 * Nodes of JSON schema `oneOf` fragments: the nodes of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaOneOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentNode, type JSONSchemaFragmentNodeOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentNodes, type JSONSchemaNestedFragmentsNodes } from './FragmentNodes.js';

/**
 * Parses a JSON schema one-of-types definition, which is any schema fragment containing a `oneOf` property. Parses each listed fragment on construction.
 */
export class JSONSchemaOneOfTypeFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentNode<TSchema, TName, TFragment> {
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
   * Nodes of each `oneOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no nodes.
   */
  public readonly oneOf: JSONSchemaNestedFragmentsNodes<TSchema, TFragment['oneOf']>;

  /**
   * Parses a JSON schema one-of-types definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentNodeOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.oneOf = fragment['oneOf'].map((member) => createJSONSchemaNestedFragmentNodes(member, this._context)) as JSONSchemaNestedFragmentsNodes<
      TSchema,
      TFragment['oneOf']
    >;
  }
}
