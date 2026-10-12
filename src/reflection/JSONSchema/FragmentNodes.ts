/**
 * Entry point parsing a whole JSON schema, the router parsing a JSON schema fragment of any kind by instantiating every per-keyword fragment
 * node matching it, and the types inferring which nodes a fragment gets: the runtime counterpart of `JSONSchemaFragmentType`'s dispatch over
 * keywords.
 *
 * This file and the per-keyword node files import each other as values, on purpose: the router instantiates every node class, and the
 * nodes of fragments with nested fragments (models, arrays, `allOf`, ...) parse those through the router. That cycle is safe as long as the
 * router only references the node classes (the collection node included) inside function bodies (never at the top level of the module), and
 * the base class they all extend lives outside of the cycle, in `Fragment.ts`.
 */

import type {
  JSONSchema7,
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
  JSONSchemaFragmentName,
  JSONSchemaFragmentTypeBranch,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
  JSONSchemaNotTypeFragment,
  JSONSchemaNullTypeFragment,
  JSONSchemaObjectTypeFragment,
  JSONSchemaOneOfTypeFragment,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaReferenceFragment,
} from '../../schema/JSONSchema/index.js';
import { JSONSchemaCollectionFragmentNode } from './CollectionFragment.js';
import {
  getJSONSchemaFragmentTypeBranches,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentNode,
  type JSONSchemaFragmentNodeOptions,
} from './Fragment.js';
import { isJSONSchemaObject } from './JSONSchema7.js';
import { JSONSchemaModelFragmentNode } from './ModelFragment.js';
import { JSONSchemaConstFragmentNode } from './ConstFragment.js';
import { JSONSchemaEnumFragmentNode } from './EnumFragment.js';
import { JSONSchemaPrimitiveTypeFragmentNode } from './PrimitiveTypeFragment.js';
import { JSONSchemaNullTypeFragmentNode } from './NullTypeFragment.js';
import { JSONSchemaArrayTypeFragmentNode } from './ArrayTypeFragment.js';
import { JSONSchemaObjectTypeFragmentNode } from './ObjectTypeFragment.js';
import { JSONSchemaAllOfTypeFragmentNode } from './AllOfTypeFragment.js';
import { JSONSchemaAnyOfTypeFragmentNode } from './AnyOfTypeFragment.js';
import { JSONSchemaOneOfTypeFragmentNode } from './OneOfTypeFragment.js';
import { JSONSchemaNotTypeFragmentNode } from './NotTypeFragment.js';
import { JSONSchemaReferenceFragmentNode } from './ReferenceFragment.js';

// #region Entry point

/**
 * Parses a JSON schema, by every node class its root fragment matches. The default way to parse a schema.
 *
 * A collection (a schema with `$defs`) is parsed as a collection node, parsing every `$defs` fragment by name, followed by the nodes of
 * the root's other keywords (the schema with its `$defs` left out). The collection node is the context every `$ref` in the schema is resolved
 * against. Any other schema is parsed with no such context, so none of its `$ref` can be resolved.
 * @param fragment JSON schema to parse
 * @returns Nodes of all fragment types the schema's root fragment matches, or an empty array if it matches none
 */
export function parseJSONSchema<TFragment extends JSONSchema7>(fragment: TFragment): Array<JSONSchemaNode<TFragment>> {
  // Parse a collection, and its root fragment against it
  if (JSONSchemaCollectionFragmentNode.is(fragment)) {
    const collection = new JSONSchemaCollectionFragmentNode(fragment);
    const { $defs: _defs, ...root } = fragment;
    return [collection, ...createJSONSchemaFragmentNodes(root as JSONSchemaNotCollectionFragment, { context: collection })] as Array<JSONSchemaNode<TFragment>>;
  }
  // Parse any other fragment, with no collection to resolve references against
  return createJSONSchemaFragmentNodes(fragment as JSONSchemaNotCollectionFragment) as Array<JSONSchemaNode<TFragment>>;
}

/**
 * Parses a JSON schema collection (a schema with `$defs`) as a collection node alone, parsing every `$defs` fragment by name. The shortcut for
 * the common case of a schema used as a collection of definitions.
 *
 * Unlike `parseJSONSchema`, it does not parse the root's other keywords. Each call parses the schema anew, so the collection node it returns is
 * never the one `parseJSONSchema` returns for the same schema, and neither are any of the nodes it holds.
 * @param fragment JSON schema collection to parse
 * @returns Node of the collection
 */
export function parseJSONSchemaCollection<TFragment extends JSONSchemaCollection>(fragment: TFragment): JSONSchemaCollectionFragmentNode<TFragment> {
  // Reject a non-collection, only possible from untyped code
  if (!JSONSchemaCollectionFragmentNode.is(fragment)) throw new TypeError('A JSON schema collection must contain a `$defs` object');
  return new JSONSchemaCollectionFragmentNode(fragment);
}

// #endregion

// #region Router

/**
 * Parses a JSON schema fragment, by instantiating every fragment node type matching it.
 *
 * A `type` array naming `object`, `array` and / or `null` is split into branches first (see `getJSONSchemaFragmentTypeBranches`). A single branch is
 * parsed as if `type` named its group directly. Several branches are alternatives (a value is of one of them), so they are parsed as an implicit
 * `anyOf`: the type independent keywords (`const`, `enum`, `$ref`, `allOf`, `anyOf`, `oneOf`, `not`) are parsed on the fragment itself, and one more
 * (`implicit`) any-of-types node holds the branches, each with the type independent keywords left out.
 * @param fragment JSON fragment to parse
 * @param options Context and name of the parsed fragment (see `JSONSchemaFragmentNodeOptions`)
 * @returns Nodes of all fragment types the fragment matches, or an empty array if it matches none
 */
export function createJSONSchemaFragmentNodes<
  TSchema extends JSONSchemaCollection,
  TFragment extends JSONSchemaNotCollectionFragment,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = undefined,
>(fragment: TFragment, options: JSONSchemaFragmentNodeOptions<TSchema, TName> = {}): Array<JSONSchemaFragmentNodeOf<TSchema, TName, TFragment>> {
  // Parse a single type array branch as is
  const branches = getJSONSchemaFragmentTypeBranches(fragment);
  if (branches.length === 1 && branches[0] !== fragment)
    return createJSONSchemaFragmentNodes(branches[0] as JSONSchemaNotCollectionFragment, options) as Array<JSONSchemaFragmentNodeOf<TSchema, TName, TFragment>>;

  // Parse every matching keyword, in the order the type layer intersects them in
  const nodes: Array<JSONSchemaFragmentNode<TSchema, TName, any>> = [];
  if (JSONSchemaModelFragmentNode.is(fragment)) nodes.push(new JSONSchemaModelFragmentNode(fragment, options));
  if (JSONSchemaConstFragmentNode.is(fragment)) nodes.push(new JSONSchemaConstFragmentNode(fragment, options));
  if (JSONSchemaEnumFragmentNode.is(fragment)) nodes.push(new JSONSchemaEnumFragmentNode(fragment, options));
  if (JSONSchemaPrimitiveTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaPrimitiveTypeFragmentNode(fragment, options));
  if (JSONSchemaNullTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaNullTypeFragmentNode(fragment, options));
  if (JSONSchemaArrayTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaArrayTypeFragmentNode(fragment, options));
  if (JSONSchemaObjectTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaObjectTypeFragmentNode(fragment, options));
  if (branches.length > 1) {
    const anyOf = branches.map((branch) =>
      Object.fromEntries(Object.entries(branch).filter(([keyword]) => !(_JSONSchemaTypeIndependentKeywords as ReadonlyArray<string>).includes(keyword))),
    ) as ReadonlyArray<JSONSchemaNotCollectionFragment>;
    nodes.push(new JSONSchemaAnyOfTypeFragmentNode({ anyOf }, { ...options, implicit: true }));
  }
  if (JSONSchemaAllOfTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaAllOfTypeFragmentNode(fragment, options));
  if (JSONSchemaAnyOfTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaAnyOfTypeFragmentNode(fragment, options));
  if (JSONSchemaOneOfTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaOneOfTypeFragmentNode(fragment, options));
  if (JSONSchemaNotTypeFragmentNode.is(fragment)) nodes.push(new JSONSchemaNotTypeFragmentNode(fragment, options));
  if (JSONSchemaReferenceFragmentNode.is(fragment)) nodes.push(new JSONSchemaReferenceFragmentNode(fragment, options));
  return nodes as Array<JSONSchemaFragmentNodeOf<TSchema, TName, TFragment>>;
}

/**
 * Parses a fragment nested in, and owned by, another fragment (e.g. a model property or an `allOf` member). Nested fragments have no name.
 * @param fragment Nested JSON fragment to parse
 * @param context Node of the JSON schema collection the parent fragment belongs to, or `undefined` if the parsed schema has no `$defs`
 * @returns Nodes of all fragment types the nested fragment matches, or an empty array if it is not a schema object (e.g. a boolean schema)
 */
export function createJSONSchemaNestedFragmentNodes<TSchema extends JSONSchemaCollection, TFragment>(
  fragment: TFragment,
  context: JSONSchemaCollectionFragmentNode<TSchema> | undefined,
): JSONSchemaNestedFragmentNodes<TSchema, TFragment> {
  return (
    isJSONSchemaObject(fragment) ? createJSONSchemaFragmentNodes(fragment as JSONSchemaNotCollectionFragment, { context }) : []
  ) as JSONSchemaNestedFragmentNodes<TSchema, TFragment>;
}

/**
 * Keywords which constrain a value regardless of its type, and are parsed by their own fragment node types
 */
const _JSONSchemaTypeIndependentKeywords = ['const', 'enum', '$ref', 'allOf', 'anyOf', 'oneOf', 'not'] as const;

// #endregion

// #region Node types

/**
 * Infers the nodes of a JSON schema, as `parseJSONSchema` returns them: the type of each element of the returned array. A collection infers the
 * collection node and the nodes of its root fragment (see `JSONSchemaCollectionRootFragment`), any other schema the nodes of the
 * fragment itself, in the unspecified collection (`JSONSchemaCollection`) as no collection is known.
 */
export type JSONSchemaNode<TFragment extends JSONSchema7> =
  // Collection
  TFragment extends JSONSchemaCollection
    ? JSONSchemaCollectionFragmentNode<TFragment> | JSONSchemaFragmentNodeOf<TFragment, undefined, JSONSchemaCollectionRootFragment<TFragment>>
    : // Any other fragment
      TFragment extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentNodeOf<JSONSchemaCollection, undefined, TFragment>
      : never;

/**
 * Infers the nodes of a JSON schema fragment, as the union of the node types matching it: the type of each element of the array the router
 * returns for the fragment.
 *
 * A node type matches when the fragment matches its fragment type (e.g. `JSONSchemaModelFragment`), as in `JSONSchemaFragmentType`. A union of
 * fragments infers the union of each fragment's nodes, and a `type` array split into several branches (see `JSONSchemaFragmentTypeBranch`) infers
 * the implicit any-of-types node holding them. A fragment with no keywords infers `never` (no nodes), while the unspecified fragment
 * (`JSONSchemaNotCollectionFragment`) infers every node type.
 */
export type JSONSchemaFragmentNodeOf<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  // Distribute over a union of fragments up front
  TFragment extends unknown
    ? // Fragment with no keywords: no nodes
      [keyof TFragment] extends [never]
      ? never
      : // Unspecified fragment: any node
        JSONSchemaNotCollectionFragment extends TFragment
        ? _JSONSchemaAnyFragmentNode<TSchema, TName, TFragment>
        : // Type array split into several branches: the nodes of the type independent keywords, and the implicit `anyOf`
          JSONSchemaFragmentTypeBranch<TFragment> extends infer B extends JSONSchemaNotCollectionFragment
          ? true extends _IsUnion<B>
            ? _JSONSchemaFragmentNodeOf<TSchema, TName, TFragment> | _JSONSchemaImplicitAnyOfTypeFragmentNode<TSchema, TName, B>
            : // Single branch, or a fragment needing no split
              _JSONSchemaFragmentNodeOf<TSchema, TName, B>
          : never
    : never;

/**
 * Infers the nodes of a single (non-union, unsplit) JSON schema fragment, as the union of the node types matching it
 */
type _JSONSchemaFragmentNodeOf<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  // Model node
  | (TFragment extends infer F extends JSONSchemaModelFragment ? JSONSchemaModelFragmentNode<TSchema, TName, F> : never)
  // Const node
  | (TFragment extends infer F extends JSONSchemaConstFragment ? JSONSchemaConstFragmentNode<TSchema, TName, F> : never)
  // Enum node
  | (TFragment extends infer F extends JSONSchemaEnumFragment ? JSONSchemaEnumFragmentNode<TSchema, TName, F> : never)
  // Primitive type node
  | (TFragment extends infer F extends JSONSchemaPrimitiveTypeFragment ? JSONSchemaPrimitiveTypeFragmentNode<TSchema, TName, F> : never)
  // Null type node
  | (TFragment extends infer F extends JSONSchemaNullTypeFragment ? JSONSchemaNullTypeFragmentNode<TSchema, TName, F> : never)
  // Array type node
  | (TFragment extends infer F extends JSONSchemaArrayTypeFragment ? JSONSchemaArrayTypeFragmentNode<TSchema, TName, F> : never)
  // Object type node
  | (TFragment extends infer F extends JSONSchemaObjectTypeFragment ? JSONSchemaObjectTypeFragmentNode<TSchema, TName, F> : never)
  // AllOf type node
  | (TFragment extends infer F extends JSONSchemaAllOfTypeFragment ? JSONSchemaAllOfTypeFragmentNode<TSchema, TName, F> : never)
  // AnyOf type node
  | (TFragment extends infer F extends JSONSchemaAnyOfTypeFragment ? JSONSchemaAnyOfTypeFragmentNode<TSchema, TName, F> : never)
  // OneOf type node
  | (TFragment extends infer F extends JSONSchemaOneOfTypeFragment ? JSONSchemaOneOfTypeFragmentNode<TSchema, TName, F> : never)
  // Not type node
  | (TFragment extends infer F extends JSONSchemaNotTypeFragment ? JSONSchemaNotTypeFragmentNode<TSchema, TName, F> : never)
  // Reference node
  | (TFragment extends infer F extends JSONSchemaReferenceFragment ? JSONSchemaReferenceFragmentNode<TSchema, TName, F> : never);

/**
 * Infers every node type an unspecified JSON schema fragment could match, as a union of node types
 */
type _JSONSchemaAnyFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  | JSONSchemaModelFragmentNode<TSchema, TName, TFragment & JSONSchemaModelFragment>
  | JSONSchemaConstFragmentNode<TSchema, TName, TFragment & JSONSchemaConstFragment>
  | JSONSchemaEnumFragmentNode<TSchema, TName, TFragment & JSONSchemaEnumFragment>
  | JSONSchemaPrimitiveTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaPrimitiveTypeFragment>
  | JSONSchemaNullTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaNullTypeFragment>
  | JSONSchemaArrayTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaArrayTypeFragment>
  | JSONSchemaObjectTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaObjectTypeFragment>
  | JSONSchemaAllOfTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaAllOfTypeFragment>
  | JSONSchemaAnyOfTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaAnyOfTypeFragment>
  | JSONSchemaOneOfTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaOneOfTypeFragment>
  | JSONSchemaNotTypeFragmentNode<TSchema, TName, TFragment & JSONSchemaNotTypeFragment>
  | JSONSchemaReferenceFragmentNode<TSchema, TName, TFragment & JSONSchemaReferenceFragment>;

/**
 * Infers the implicit any-of-types node of a `type` array split into several branches, holding a branch per group of type names, each with the
 * type independent keywords left out
 */
type _JSONSchemaImplicitAnyOfTypeFragmentNode<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TBranch extends JSONSchemaNotCollectionFragment,
> = JSONSchemaAnyOfTypeFragmentNode<
  TSchema,
  TName,
  {
    anyOf: ReadonlyArray<
      TBranch extends unknown ? { [K in keyof TBranch as K extends (typeof _JSONSchemaTypeIndependentKeywords)[number] ? never : K]: TBranch[K] } : never
    >;
  }
>;

/**
 * Determines if a type is a union of several types, resolving to `boolean` for a union, and `false` otherwise
 */
type _IsUnion<T, TAll = T> = T extends unknown ? ([TAll] extends [T] ? false : true) : never;

/**
 * Infers the nodes of a fragment nested in another fragment, as the router returns them (see `JSONSchemaParsedFragment`)
 */
export type JSONSchemaNestedFragmentNodes<TSchema extends JSONSchemaCollection, TFragment> = Array<
  JSONSchemaFragmentNodeOf<TSchema, undefined, JSONSchemaParsedFragment<TFragment>>
>;

/**
 * Infers the nodes of each fragment in an array of nested fragments, element by element for a tuple
 */
export type JSONSchemaNestedFragmentsNodes<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  -readonly [I in keyof TFragments]: JSONSchemaNestedFragmentNodes<TSchema, TFragments[I]>;
};

/**
 * Gets the fragment type a value is parsed as: a (non-collection) fragment as is, an object of any other shape as the unspecified fragment, and
 * anything else (a boolean schema, an array) as `never`, i.e. with no nodes
 */
export type JSONSchemaParsedFragment<T> =
  // Fragment
  T extends JSONSchemaNotCollectionFragment
    ? T
    : // Not a schema object
      T extends ReadonlyArray<unknown>
      ? never
      : // Object of unknown shape
        T extends object
        ? JSONSchemaNotCollectionFragment
        : never;

// #endregion
