/**
 * Facets of JSON schema `type: "array"` fragments: the facets of their `items` fragment.
 */

import type { JSONSchema7, JSONSchemaArrayTypeFragment, JSONSchemaCollection, JSONSchemaDefinitionName } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { createJSONSchemaNestedFragmentFacets, type JSONSchemaNestedFragmentFacets } from './FragmentFacets.js';

/**
 * Parses a JSON schema array type definition, which is any schema fragment containing a `type="array"` property and an optional `items` property.
 * Parses the `items` fragment on construction.
 */
export class JSONSchemaArrayTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaArrayTypeFragment = JSONSchemaArrayTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
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
   * Facets of the `items` fragment, or `undefined` if there is none. An `items` which is not a single schema object (a boolean schema, or a tuple's
   * array of schemas) has no facets. Built eagerly on construction, unlike a reference fragment's `ref`, as the `items` fragment is nested in, and
   * owned by, this fragment, so parsing it can not recurse back into this fragment
   */
  public readonly items: _JSONSchemaArrayTypeFragmentItemsFacets<TSchema, TFragment>;

  /**
   * Parses a JSON schema array type definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    const items = fragment['items'];
    this.items = (items === undefined ? undefined : createJSONSchemaNestedFragmentFacets(items, this._collection)) as _JSONSchemaArrayTypeFragmentItemsFacets<
      TSchema,
      TFragment
    >;
  }

  // TODO: Not implemented yet (as in the type layer): tuples, i.e. `prefixItems` (or an `items` array, with `additionalItems`). Planned as a separate
  //       `prefixItems` property, holding the facets of each position's fragment, while `items` keeps parsing the fragment of every other item
}

/**
 * Infers the facets of an array type fragment's `items` fragment, or `undefined` if it has none
 */
type _JSONSchemaArrayTypeFragmentItemsFacets<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaArrayTypeFragment> =
  // Items keyword known
  'items' extends keyof TFragment
    ? // Items defined
      TFragment extends { items: infer I }
      ? JSONSchemaNestedFragmentFacets<TSchema, I>
      : // Items possibly defined
        TFragment extends { items?: infer I }
        ? JSONSchemaNestedFragmentFacets<TSchema, Exclude<I, undefined>> | undefined
        : undefined
    : // No items
      undefined;
