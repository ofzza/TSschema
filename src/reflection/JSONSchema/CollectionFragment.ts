/**
 * Reflection of JSON schema collections (schemas with `$defs`): each of the collection's fragments, reflected by name. A collection reflection is also the
 * context every other reflection of the same schema resolves its `$ref` against.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import { isJSONSchemaObject } from './JSONSchema7.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';
import { createJSONSchemaFragmentReflections, type JSONSchemaFragmentReflection, type JSONSchemaReflectedFragment } from './FragmentReflections.js';

/**
 * Reflects a JSON schema collection, which is any schema fragment containing a `$defs` object. Reflects each fragment of its `$defs` on construction.
 *
 * Only a schema's root can be a collection (`#/$defs/<name>` references always point into the root), so the router never reflects one: it is reflected
 * by `reflectJSONSchema`, next to the reflections of the root's other keywords, all of which (and everything nested in them) resolve their `$ref` against
 * it.
 */
export class JSONSchemaCollectionFragmentReflect<TSchema extends JSONSchemaCollection> extends JSONSchemaFragmentReflect<TSchema, undefined, TSchema> {
  /**
   * Determines if a JSON schema fragment is a collection (i.e., contains a `$defs` object). The runtime counterpart of `JSONSchemaFragmentIsCollection`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a collection
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaCollection {
    return isJSONSchemaObject(fragment?.['$defs']);
  }

  /**
   * Names of all the collection's fragments
   */
  public readonly names: Array<JSONSchemaFragmentName<TSchema>>;

  /**
   * Reflections of each of the collection's fragments, by fragment name: the reflections of all fragment types each fragment matches, or an empty array if
   * it matches none
   */
  public readonly $defs: _JSONSchemaCollectionFragmentsReflect<TSchema>;

  /**
   * Reflects a JSON schema collection. The collection is the context its own fragments are reflected in.
   * @param _fragment JSON schema collection to reflect on
   */
  public constructor(_fragment: TSchema) {
    // The collection can not be passed to the base class as its own context before it is constructed, so it is set as one right after
    super(undefined, undefined, _fragment);
    this._schema = this;
    // Extract fragment names
    this.names = Object.keys(_fragment['$defs']) as Array<JSONSchemaFragmentName<TSchema>>;
    // Extract fragments' reflections
    this.$defs = Object.fromEntries(
      this.names.map((name) => [
        name,
        createJSONSchemaFragmentReflections(this, name, (_fragment['$defs'] as Record<PropertyKey, JSONSchemaNotCollectionFragment>)[name]),
      ]),
    ) as unknown as _JSONSchemaCollectionFragmentsReflect<TSchema>;
  }
}

/**
 * Gets the fragment addressed by name from a JSON schema collection, as it is reflected (see `JSONSchemaReflectedFragment`)
 */
export type JSONSchemaCollectionReflectedFragment<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema>,
> = JSONSchemaReflectedFragment<TSchema['$defs'][TName]>;

/**
 * Infers the reflections of each of a JSON schema collection's fragments, by fragment name
 */
type _JSONSchemaCollectionFragmentsReflect<TSchema extends JSONSchemaCollection> = {
  [TName in JSONSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentReflection<TSchema, TName, JSONSchemaCollectionReflectedFragment<TSchema, TName>>>;
};
