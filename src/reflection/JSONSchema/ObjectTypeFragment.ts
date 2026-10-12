/**
 * Facets of JSON schema `type: "object"` fragments without `properties`.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaObjectTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';

/**
 * Parses a JSON schema object type definition, which is any schema fragment containing a `type="object"` property and no `properties` property (one
 * with `properties` is a model, see `JSONSchemaModelFragmentFacet`).
 */
export class JSONSchemaObjectTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is an object type definition (i.e., contains a `type="object"` property and no `properties` property). The
   * runtime counterpart of `JSONSchemaFragmentIsObjectType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is an object type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaObjectTypeFragment {
    return fragment?.type === 'object' && fragment?.['properties'] === undefined;
  }

  /**
   * The fragment's `type`, always `"object"`
   */
  public readonly type: TFragment['type'];

  /**
   * Parses a JSON schema object type definition
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`,
  //       `required`
}
