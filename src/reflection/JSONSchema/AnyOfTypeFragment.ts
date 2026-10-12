/**
 * Nodes of JSON schema `anyOf` fragments: the nodes of each listed fragment.
 */

import type { JSONSchema7, JSONSchemaAnyOfTypeFragment, JSONSchemaCollection, JSONSchemaFragmentName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentNode, type JSONSchemaFragmentNodeOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentNodes, type JSONSchemaNestedFragmentsNodes } from './FragmentNodes.js';

/**
 * Parses a JSON schema any-of-types definition, which is any schema fragment containing an `anyOf` property. Parses each listed fragment on construction.
 */
export class JSONSchemaAnyOfTypeFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentNode<TSchema, TName, TFragment> {
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
   * Nodes of each `anyOf` fragment, in order. A member which is not a schema object (e.g. a boolean schema) has no nodes.
   */
  public readonly anyOf: JSONSchemaNestedFragmentsNodes<TSchema, TFragment['anyOf']>;

  /**
   * Whether this is the node of an implicit `anyOf`, built by the router from the branches of a `type` array (see `createJSONSchemaFragmentNodes`), rather
   * than an `anyOf` keyword of the fragment itself. The `fragment` of an implicit `anyOf` is the generated `anyOf` fragment, not the fragment it was
   * built from.
   */
  public readonly implicit: boolean;

  /**
   * Parses a JSON schema any-of-types definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`), and whether it is an `implicit` `anyOf`, generated
   * from the branches of a `type` array
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentNodeOptions<TSchema, TName> & { implicit?: boolean } = {}) {
    super(fragment, options);
    this.anyOf = fragment['anyOf'].map((member) => createJSONSchemaNestedFragmentNodes(member, this._context)) as JSONSchemaNestedFragmentsNodes<
      TSchema,
      TFragment['anyOf']
    >;
    this.implicit = options.implicit ?? false;
  }
}
