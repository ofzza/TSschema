/**
 * Reflection of JSON schema `$ref` fragments: the name of the referenced fragment, and its reflections, resolved lazily against the collection.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaReferenceFragment } from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentReflect, JSONSchemaCollectionReflectedFragment } from './CollectionFragment.js';
import { JSONSchemaFragmentReflect } from './Fragment.js';
import type { JSONSchemaFragmentReflection } from './FragmentReflections.js';

/**
 * Reflects a JSON schema reference definition, which is any schema fragment containing a `$ref` property.
 */
export class JSONSchemaReferenceFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaReferenceFragment = JSONSchemaReferenceFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a reference definition (i.e., contains a `$ref` string). The runtime counterpart of
   * `JSONSchemaFragmentIsReference`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a reference definition
   */
  public static check(fragment: JSONSchema7): fragment is JSONSchemaReferenceFragment {
    return typeof fragment?.['$ref'] === 'string';
  }

  /**
   * Name of the referenced fragment, parsed from a `#/$defs/<name>` reference, or `undefined` if the reference is of any other form or names no fragment
   * of the collection. JSON pointers are not supported (yet), as in the type layer: a reference is not unescaped (`~0`, `~1`) or percent-decoded, and
   * can not point anywhere but directly into `$defs`.
   */
  public readonly refName: _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>;

  /**
   * Reflections of the referenced fragment, as held by the collection, or `undefined` if the reference can not be resolved. Resolved lazily on access,
   * unlike an array type fragment's `items`: the referenced fragment is shared, not owned by this fragment, and (in)directly recursive references would
   * never finish constructing if resolved eagerly. Besides, the collection's reflections are not available yet while it is still constructing them.
   */
  public get ref(): _JSONSchemaReferenceFragmentRefReflect<TSchema, _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>> {
    return (
      this.refName === undefined ? undefined : this._schema.fragment(this.refName as JSONSchemaFragmentName<TSchema>)
    ) as _JSONSchemaReferenceFragmentRefReflect<TSchema, _JSONSchemaReferenceFragmentRefName<TSchema, TFragment>>;
  }

  /**
   * Reflects a JSON schema reference definition
   * @param _schema Reflection of the JSON schema collection the fragment belongs to
   * @param _fragmentName Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
   * @param _fragment JSON fragment to reflect on
   */
  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    const name = /^#\/\$defs\/(.+)$/.exec(_fragment['$ref'])?.[1];
    this.refName = (name !== undefined && (_schema.names as Array<string>).includes(name) ? name : undefined) as _JSONSchemaReferenceFragmentRefName<
      TSchema,
      TFragment
    >;
  }
}

/**
 * Infers the name of the fragment referenced by a reference fragment, parsed from a `#/$defs/<name>` reference. A reference of any other form, or one
 * naming no fragment of the collection, infers `undefined`; an unspecified (`string`) reference infers any fragment name or `undefined`.
 */
type _JSONSchemaReferenceFragmentRefName<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaReferenceFragment> =
  // Unspecified reference
  string extends TFragment['$ref']
    ? JSONSchemaFragmentName<TSchema> | undefined
    : // Reference to a fragment of the collection
      TFragment['$ref'] extends `#/$defs/${infer N}`
      ? N extends JSONSchemaFragmentName<TSchema>
        ? N
        : undefined
      : // Any other reference
        undefined;

/**
 * Infers the reflections of the fragment(s) referenced by name, distributing over a union of names, or `undefined` for an unresolved reference
 */
type _JSONSchemaReferenceFragmentRefReflect<TSchema extends JSONSchemaCollection, TRefName> =
  // Resolved reference
  TRefName extends JSONSchemaFragmentName<TSchema>
    ? Array<JSONSchemaFragmentReflection<TSchema, TRefName, JSONSchemaCollectionReflectedFragment<TSchema, TRefName>>>
    : // Unresolved reference
      undefined;
