/**
 * Base class of every JSON schema fragment node, and the runtime counterpart of `JSONSchemaFragmentTypeBranch`, splitting a fragment's `type`
 * array into branches.
 *
 * Every per-keyword node class extends the base class defined here, so this file must never import any of them (or the router in
 * `FragmentNodes.ts`, which does) as a value: it is kept out of the node files' import cycle, so that it is always evaluated before any class
 * extending it.
 */

import type {
  JSONSchema7,
  JSONSchemaCollection,
  JSONSchemaFragmentName,
  JSONSchemaFragmentType,
  JSONSchemaFragmentTypeBranch,
  JSONSchemaNotCollectionFragment,
} from '../../schema/JSONSchema/index.js';
import type { JSONSchemaCollectionFragmentNode } from './CollectionFragment.js';
import { isJSONSchemaPrimitiveTypeName } from './JSONSchema7.js';

/**
 * Parses a JSON schema fragment. Base class of every per-keyword fragment node: a fragment carrying several keywords is parsed by an instance
 * of each matching node class (see `createJSONSchemaFragmentNodes`).
 */
export abstract class JSONSchemaFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchema7 = JSONSchemaNotCollectionFragment,
> {
  /**
   * Value type inferred from the parsed fragment (see `JSONSchemaFragmentType`), or from its root fragment for a collection (see
   * `JSONSchemaCollectionRootFragment`). Only meant for type inference, as `typeof node.Type`: it holds no value, and throws if accessed at runtime.
   */
  public get Type(): _JSONSchemaParsedFragmentType<TFragment, TSchema> {
    throw new Error('This accessor should never be accessed, it is only meant to be used for type inference convenience: `typeof node.Type`');
  }

  /**
   * Name of the fragment within its collection, or `undefined` for a nested (or root) fragment
   */
  public get name(): TName {
    return this._name;
  }

  /**
   * The parsed JSON fragment
   */
  public get fragment(): TFragment {
    return this._fragment;
  }

  /**
   * The parsed JSON fragment
   */
  protected _fragment: TFragment;

  /**
   * Node of the JSON schema collection the fragment belongs to, against which every `$ref` is resolved, or `undefined` if the parsed schema has
   * no `$defs`
   */
  protected _context: JSONSchemaCollectionFragmentNode<TSchema> | undefined;

  /**
   * Name of the fragment within its collection, or `undefined` for a nested (or root) fragment
   */
  protected _name: TName;

  /**
   * Parses a JSON schema fragment
   * @param fragment JSON fragment to parse
   * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`)
   */
  public constructor(fragment: TFragment, { context, name }: JSONSchemaFragmentNodeOptions<TSchema, TName> = {}) {
    this._fragment = fragment;
    this._context = context;
    this._name = name as TName;
  }

  // TODO: Not implemented yet (as in the type layer): `readOnly`, `writeOnly`
}

/**
 * Options of a JSON schema fragment node, naming the context the fragment is parsed in
 */
export type JSONSchemaFragmentNodeOptions<TSchema extends JSONSchemaCollection, TName extends JSONSchemaFragmentName<TSchema> | undefined> = {
  /**
   * Node of the JSON schema collection the fragment belongs to, against which every `$ref` is resolved. Omitted if the parsed schema has no
   * `$defs`, leaving every `$ref` unresolved.
   */
  context?: JSONSchemaCollectionFragmentNode<TSchema>;
  /**
   * Name of the fragment within the collection. Omitted for a nested (or root) fragment.
   */
  name?: TName;
};

/**
 * Splits a fragment whose `type` is an array naming `object`, `array` and / or `null` into branches, one per group of type names (`object`, `array`,
 * `null`, and all primitive types together as an array of type names). Each branch is the fragment with `type` narrowed to the group, keeping every other
 * keyword. Any other fragment is its own single branch. The runtime counterpart of `JSONSchemaFragmentTypeBranch`.
 * @param fragment JSON fragment to split
 * @returns Branches of the fragment, or an array holding just the fragment itself if its `type` needs no splitting
 */
export function getJSONSchemaFragmentTypeBranches<TFragment extends JSONSchemaNotCollectionFragment>(
  fragment: TFragment,
): Array<JSONSchemaFragmentTypeBranch<TFragment>> {
  const type = fragment?.type;
  if (!(type instanceof Array) || !(type.includes('object') || type.includes('array') || type.includes('null')))
    return [fragment as JSONSchemaFragmentTypeBranch<TFragment>];
  const primitives = type.filter((name) => isJSONSchemaPrimitiveTypeName(name));
  const groups = [
    ...(type.includes('object') ? ['object' as const] : []),
    ...(type.includes('array') ? ['array' as const] : []),
    ...(type.includes('null') ? ['null' as const] : []),
    ...(primitives.length ? [primitives] : []),
  ];
  return groups.map((group) => ({ ...fragment, type: group }) as JSONSchemaFragmentTypeBranch<TFragment>);
}

/**
 * Gets the root fragment of a JSON schema collection, i.e. the collection with its `$defs` left out
 */
export type JSONSchemaCollectionRootFragment<TSchema extends JSONSchemaCollection> =
  Omit<TSchema, '$defs'> extends infer F extends JSONSchemaNotCollectionFragment ? F : never;

/**
 * Infers the value type of a parsed fragment: of its root fragment for a collection, of the fragment itself otherwise
 */
type _JSONSchemaParsedFragmentType<TFragment extends JSONSchema7, TSchema extends JSONSchemaCollection> =
  // Collection
  TFragment extends JSONSchemaCollection
    ? JSONSchemaFragmentType<JSONSchemaCollectionRootFragment<TFragment>, TSchema>
    : // Any other fragment
      TFragment extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentType<TFragment, TSchema>
      : unknown;
