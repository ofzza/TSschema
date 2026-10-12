/**
 * Facets of JSON schema collections (schemas with `$defs`): each of the collection's fragments, parsed by name. A collection facet is also the
 * context every other facet of the same schema resolves its `$ref` against.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import { isJSONSchemaObject } from './JSONSchema7.js';
import { JSONSchemaFragmentFacet } from './Fragment.js';
import { createJSONSchemaFragmentFacets, type JSONSchemaFragmentFacetOf, type JSONSchemaParsedFragment } from './FragmentFacets.js';

/**
 * Parses a JSON schema collection, which is any schema fragment containing a `$defs` object. Parses each fragment of its `$defs` on construction.
 *
 * Only a schema's root can be a collection (`#/$defs/<name>` references always point into the root), so the router never parses one: it is parsed
 * by `parseJSONSchema`, next to the facets of the root's other keywords, all of which (and everything nested in them) resolve their `$ref` against
 * it.
 */
export class JSONSchemaCollectionFragmentFacet<TSchema extends JSONSchemaCollection> extends JSONSchemaFragmentFacet<TSchema, undefined, TSchema> {
  /**
   * Determines if a JSON schema fragment is a collection (i.e., contains a `$defs` object). The runtime counterpart of `JSONSchemaFragmentIsCollection`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a collection
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaCollection {
    return isJSONSchemaObject(fragment?.['$defs']);
  }

  /**
   * Names of all the collection's fragments
   */
  public readonly names: Array<JSONSchemaFragmentName<TSchema>>;

  /**
   * Facets of each of the collection's fragments, by fragment name: the facets of all fragment types each fragment matches, or an empty array if
   * it matches none
   */
  public readonly $defs: _JSONSchemaCollectionFragmentsFacets<TSchema>;

  /**
   * Parses a JSON schema collection. The collection is the context its own fragments are parsed in.
   * @param fragment JSON schema collection to parse
   */
  public constructor(fragment: TSchema) {
    // The collection can not be passed to the base class as its own context before it is constructed, so it is set as one right after
    super(fragment);
    this._context = this;
    // Extract fragment names
    this.names = Object.keys(fragment['$defs']) as Array<JSONSchemaFragmentName<TSchema>>;
    // Extract fragments' facets
    this.$defs = Object.fromEntries(
      this.names.map((name) => [
        name,
        createJSONSchemaFragmentFacets((fragment['$defs'] as Record<PropertyKey, JSONSchemaNotCollectionFragment>)[name], { context: this, name }),
      ]),
    ) as unknown as _JSONSchemaCollectionFragmentsFacets<TSchema>;
  }
}

/**
 * Gets the fragment addressed by name from a JSON schema collection, as it is parsed (see `JSONSchemaParsedFragment`)
 */
export type JSONSchemaCollectionParsedFragment<TSchema extends JSONSchemaCollection, TName extends JSONSchemaFragmentName<TSchema>> = JSONSchemaParsedFragment<
  TSchema['$defs'][TName]
>;

/**
 * Infers the facets of each of a JSON schema collection's fragments, by fragment name
 */
type _JSONSchemaCollectionFragmentsFacets<TSchema extends JSONSchemaCollection> = {
  [TName in JSONSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentFacetOf<TSchema, TName, JSONSchemaCollectionParsedFragment<TSchema, TName>>>;
};
