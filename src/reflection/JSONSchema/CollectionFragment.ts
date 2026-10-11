/**
 * Reflection of a JSON schema collection (a schema with `$defs`): the entry point of the runtime reflection, reflecting each of the collection's
 * fragments by name, and its own root fragment.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotCollectionFragment } from '../../schema/JSONSchema/index.js';
import { isJSONSchemaObject } from './JSONSchema7.js';
import { createJSONSchemaFragmentReflections, type JSONSchemaFragmentReflection, type JSONSchemaReflectedFragment } from './FragmentReflections.js';

/**
 * Reflects a JSON schema collection. Reflects each fragment of its `$defs` on construction, holding on to the reflections every `$ref` between fragments
 * is resolved against.
 *
 * Unlike every other fragment reflection, it does not extend `JSONSchemaFragmentReflect`: a collection is the context fragment reflections are reflected
 * in, and its own root fragment (everything but `$defs`) is reflected separately, as `root`.
 */
export class JSONSchemaCollectionFragmentReflect<TSchema extends JSONSchemaCollection> {
  /**
   * Determines if a JSON schema fragment is a collection (i.e., contains a `$defs` object). The runtime counterpart of `JSONSchemaFragmentIsCollection`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a collection
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaCollection {
    return isJSONSchemaObject(fragment?.['$defs']);
  }

  /**
   * Reflects a JSON schema collection
   * @param _schema JSON schema collection to reflect on
   */
  public constructor(protected _schema: TSchema) {
    // Extract fragment names
    this._fragmentNames = Object.keys(this._schema['$defs']) as Array<JSONSchemaFragmentName<TSchema>>;
    // Extract fragments' reflections
    this._fragmentReflections = Object.fromEntries(
      this._fragmentNames.map((name) => [
        name,
        createJSONSchemaFragmentReflections(this, name, (this._schema['$defs'] as Record<PropertyKey, JSONSchemaNotCollectionFragment>)[name]),
      ]),
    ) as unknown as _JSONSchemaCollectionFragmentsReflect<TSchema>;
    // Extract the reflections of the collection's own root fragment (everything but its `$defs`)
    const { $defs: _defs, ...root } = this._schema;
    this.root = createJSONSchemaFragmentReflections(this, undefined, root as unknown as _JSONSchemaCollectionRootFragment<TSchema>);
  }

  /**
   * Reflections of the collection's own root fragment, i.e. of the schema with its `$defs` left out. A root with no keywords besides `$defs` has none.
   */
  public readonly root: Array<JSONSchemaFragmentReflection<TSchema, undefined, _JSONSchemaCollectionRootFragment<TSchema>>>;

  /**
   * Names of all the collection's fragments
   */
  protected _fragmentNames: Array<JSONSchemaFragmentName<TSchema>>;

  /**
   * Reflections of each of the collection's fragments, by fragment name
   */
  protected _fragmentReflections: _JSONSchemaCollectionFragmentsReflect<TSchema>;

  /**
   * Names of all the collection's fragments
   */
  public get names(): Array<JSONSchemaFragmentName<TSchema>> {
    return [...this._fragmentNames];
  }

  /**
   * Gets the reflections of a fragment of the collection, addressed by name
   * @param name Name of the fragment
   * @returns Reflections of all fragment types the fragment matches, or an empty array if it matches none
   */
  public fragment<TName extends JSONSchemaFragmentName<TSchema>>(
    name: TName,
  ): Array<JSONSchemaFragmentReflection<TSchema, TName, JSONSchemaCollectionReflectedFragment<TSchema, TName>>> {
    return this._fragmentReflections[name];
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
 * Gets the root fragment of a JSON schema collection, i.e. the collection with its `$defs` left out
 */
type _JSONSchemaCollectionRootFragment<TSchema extends JSONSchemaCollection> =
  Omit<TSchema, '$defs'> extends infer F extends JSONSchemaNotCollectionFragment ? F : never;

/**
 * Infers the reflections of each of a JSON schema collection's fragments, by fragment name
 */
type _JSONSchemaCollectionFragmentsReflect<TSchema extends JSONSchemaCollection> = {
  [TName in JSONSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentReflection<TSchema, TName, JSONSchemaCollectionReflectedFragment<TSchema, TName>>>;
};
