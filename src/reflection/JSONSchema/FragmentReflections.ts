/**
 * Entry point reflecting a whole JSON schema, the router reflecting a JSON schema fragment of any kind by instantiating every per-keyword fragment
 * reflection matching it, and the types inferring which reflections a fragment gets: the runtime counterpart of `JSONSchemaFragmentType`'s dispatch over
 * keywords.
 *
 * This file and the per-keyword reflection files import each other as values, on purpose: the router instantiates every reflection class, and the
 * reflections of fragments with nested fragments (models, arrays, `allOf`, ...) reflect those through the router. That cycle is safe as long as the
 * router only references the reflection classes (the collection reflection included) inside function bodies (never at the top level of the module), and
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
import { JSONSchemaCollectionFragmentReflect } from './CollectionFragment.js';
import { getJSONSchemaFragmentTypeBranches, type JSONSchemaCollectionRootFragment, type JSONSchemaFragmentReflect } from './Fragment.js';
import { isJSONSchemaObject } from './JSONSchema7.js';
import { JSONSchemaModelFragmentReflect } from './ModelFragment.js';
import { JSONSchemaConstFragmentReflect } from './ConstFragment.js';
import { JSONSchemaEnumFragmentReflect } from './EnumFragment.js';
import { JSONSchemaPrimitiveTypeFragmentReflect } from './PrimitiveTypeFragment.js';
import { JSONSchemaNullTypeFragmentReflect } from './NullTypeFragment.js';
import { JSONSchemaArrayTypeFragmentReflect } from './ArrayTypeFragment.js';
import { JSONSchemaObjectTypeFragmentReflect } from './ObjectTypeFragment.js';
import { JSONSchemaAllOfTypeFragmentReflect } from './AllOfTypeFragment.js';
import { JSONSchemaAnyOfTypeFragmentReflect } from './AnyOfTypeFragment.js';
import { JSONSchemaOneOfTypeFragmentReflect } from './OneOfTypeFragment.js';
import { JSONSchemaNotTypeFragmentReflect } from './NotTypeFragment.js';
import { JSONSchemaReferenceFragmentReflect } from './ReferenceFragment.js';

// #region Entry point

/**
 * Reflects a JSON schema, by every reflection class its root fragment matches. The default way to reflect a schema.
 *
 * A collection (a schema with `$defs`) is reflected as a collection reflection, reflecting every `$defs` fragment by name, followed by the reflections of
 * the root's other keywords (the schema with its `$defs` left out). The collection reflection is the context every `$ref` in the schema is resolved
 * against. Any other schema is reflected with no such context, so none of its `$ref` can be resolved.
 * @param fragment JSON schema to reflect on
 * @returns Reflections of all fragment types the schema's root fragment matches, or an empty array if it matches none
 */
export function reflectJSONSchema<TFragment extends JSONSchema7>(fragment: TFragment): Array<JSONSchemaReflection<TFragment>> {
  // Reflect a collection, and its root fragment against it
  if (JSONSchemaCollectionFragmentReflect.check(fragment)) {
    const collection = new JSONSchemaCollectionFragmentReflect(fragment);
    const { $defs: _defs, ...root } = fragment;
    return [collection, ...createJSONSchemaFragmentReflections(collection, undefined, root as JSONSchemaNotCollectionFragment)] as Array<
      JSONSchemaReflection<TFragment>
    >;
  }
  // Reflect any other fragment, with no collection to resolve references against
  return createJSONSchemaFragmentReflections(undefined, undefined, fragment as JSONSchemaNotCollectionFragment) as Array<JSONSchemaReflection<TFragment>>;
}

// #endregion

// #region Router

/**
 * Reflects a JSON schema fragment, by instantiating every fragment reflection type matching it.
 *
 * A `type` array naming `object`, `array` and / or `null` is split into branches first (see `getJSONSchemaFragmentTypeBranches`). A single branch is
 * reflected as if `type` named its group directly. Several branches are alternatives (a value is of one of them), so they are reflected as an implicit
 * `anyOf`: the type independent keywords (`const`, `enum`, `$ref`, `allOf`, `anyOf`, `oneOf`, `not`) are reflected on the fragment itself, and one more
 * (`implicit`) any-of-types reflection holds the branches, each with the type independent keywords left out.
 * @param schema Reflection of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
 * @param name Name of the fragment within the collection, or `undefined` for a nested (or root) fragment
 * @param fragment JSON fragment to reflect on
 * @returns Reflections of all fragment types the fragment matches, or an empty array if it matches none
 */
export function createJSONSchemaFragmentReflections<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
>(
  schema: JSONSchemaCollectionFragmentReflect<TSchema> | undefined,
  name: TName,
  fragment: TFragment,
): Array<JSONSchemaFragmentReflection<TSchema, TName, TFragment>> {
  // Reflect a single type array branch as is
  const branches = getJSONSchemaFragmentTypeBranches(fragment);
  if (branches.length === 1 && branches[0] !== fragment)
    return createJSONSchemaFragmentReflections(schema, name, branches[0] as JSONSchemaNotCollectionFragment) as Array<
      JSONSchemaFragmentReflection<TSchema, TName, TFragment>
    >;

  // Reflect every matching keyword, in the order the type layer intersects them in
  const reflections: Array<JSONSchemaFragmentReflect<TSchema, TName, any>> = [];
  if (JSONSchemaModelFragmentReflect.check(fragment)) reflections.push(new JSONSchemaModelFragmentReflect(schema, name, fragment));
  if (JSONSchemaConstFragmentReflect.check(fragment)) reflections.push(new JSONSchemaConstFragmentReflect(schema, name, fragment));
  if (JSONSchemaEnumFragmentReflect.check(fragment)) reflections.push(new JSONSchemaEnumFragmentReflect(schema, name, fragment));
  if (JSONSchemaPrimitiveTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaPrimitiveTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaNullTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaNullTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaArrayTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaArrayTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaObjectTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaObjectTypeFragmentReflect(schema, name, fragment));
  if (branches.length > 1) {
    const anyOf = branches.map((branch) =>
      Object.fromEntries(Object.entries(branch).filter(([keyword]) => !(_JSONSchemaTypeIndependentKeywords as ReadonlyArray<string>).includes(keyword))),
    ) as ReadonlyArray<JSONSchemaNotCollectionFragment>;
    reflections.push(new JSONSchemaAnyOfTypeFragmentReflect(schema, name, { anyOf }, true));
  }
  if (JSONSchemaAllOfTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaAllOfTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaAnyOfTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaAnyOfTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaOneOfTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaOneOfTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaNotTypeFragmentReflect.check(fragment)) reflections.push(new JSONSchemaNotTypeFragmentReflect(schema, name, fragment));
  if (JSONSchemaReferenceFragmentReflect.check(fragment)) reflections.push(new JSONSchemaReferenceFragmentReflect(schema, name, fragment));
  return reflections as Array<JSONSchemaFragmentReflection<TSchema, TName, TFragment>>;
}

/**
 * Reflects a fragment nested in, and owned by, another fragment (e.g. a model property or an `allOf` member). Nested fragments have no name.
 * @param schema Reflection of the JSON schema collection the parent fragment belongs to, or `undefined` if the reflected schema has no `$defs`
 * @param fragment Nested JSON fragment to reflect on
 * @returns Reflections of all fragment types the nested fragment matches, or an empty array if it is not a schema object (e.g. a boolean schema)
 */
export function createJSONSchemaNestedFragmentReflections<TSchema extends JSONSchemaCollection, TFragment>(
  schema: JSONSchemaCollectionFragmentReflect<TSchema> | undefined,
  fragment: TFragment,
): JSONSchemaNestedFragmentReflections<TSchema, TFragment> {
  return (
    isJSONSchemaObject(fragment) ? createJSONSchemaFragmentReflections(schema, undefined, fragment as JSONSchemaNotCollectionFragment) : []
  ) as JSONSchemaNestedFragmentReflections<TSchema, TFragment>;
}

/**
 * Keywords which constrain a value regardless of its type, and are reflected by their own fragment reflection types
 */
const _JSONSchemaTypeIndependentKeywords = ['const', 'enum', '$ref', 'allOf', 'anyOf', 'oneOf', 'not'] as const;

// #endregion

// #region Reflection types

/**
 * Infers the reflections of a JSON schema, as `reflectJSONSchema` returns them: the type of each element of the returned array. A collection infers the
 * collection reflection and the reflections of its root fragment (see `JSONSchemaCollectionRootFragment`), any other schema the reflections of the
 * fragment itself, in the unspecified collection (`JSONSchemaCollection`) as no collection is known.
 */
export type JSONSchemaReflection<TFragment extends JSONSchema7> =
  // Collection
  TFragment extends JSONSchemaCollection
    ? JSONSchemaCollectionFragmentReflect<TFragment> | JSONSchemaFragmentReflection<TFragment, undefined, JSONSchemaCollectionRootFragment<TFragment>>
    : // Any other fragment
      TFragment extends JSONSchemaNotCollectionFragment
      ? JSONSchemaFragmentReflection<JSONSchemaCollection, undefined, TFragment>
      : never;

/**
 * Infers the reflections of a JSON schema fragment, as the union of the reflection types matching it: the type of each element of the array the router
 * returns for the fragment.
 *
 * A reflection type matches when the fragment matches its fragment type (e.g. `JSONSchemaModelFragment`), as in `JSONSchemaFragmentType`. A union of
 * fragments infers the union of each fragment's reflections, and a `type` array split into several branches (see `JSONSchemaFragmentTypeBranch`) infers
 * the implicit any-of-types reflection holding them. A fragment with no keywords infers `never` (no reflections), while the unspecified fragment
 * (`JSONSchemaNotCollectionFragment`) infers every reflection type.
 */
export type JSONSchemaFragmentReflection<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  // Distribute over a union of fragments up front
  TFragment extends unknown
    ? // Fragment with no keywords: no reflections
      [keyof TFragment] extends [never]
      ? never
      : // Unspecified fragment: any reflection
        JSONSchemaNotCollectionFragment extends TFragment
        ? _JSONSchemaAnyFragmentReflection<TSchema, TName, TFragment>
        : // Type array split into several branches: the reflections of the type independent keywords, and the implicit `anyOf`
          JSONSchemaFragmentTypeBranch<TFragment> extends infer B extends JSONSchemaNotCollectionFragment
          ? true extends _IsUnion<B>
            ? _JSONSchemaFragmentReflection<TSchema, TName, TFragment> | _JSONSchemaImplicitAnyOfTypeFragmentReflect<TSchema, TName, B>
            : // Single branch, or a fragment needing no split
              _JSONSchemaFragmentReflection<TSchema, TName, B>
          : never
    : never;

/**
 * Infers the reflections of a single (non-union, unsplit) JSON schema fragment, as the union of the reflection types matching it
 */
type _JSONSchemaFragmentReflection<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  // Model reflection
  | (TFragment extends infer F extends JSONSchemaModelFragment ? JSONSchemaModelFragmentReflect<TSchema, TName, F> : never)
  // Const reflection
  | (TFragment extends infer F extends JSONSchemaConstFragment ? JSONSchemaConstFragmentReflect<TSchema, TName, F> : never)
  // Enum reflection
  | (TFragment extends infer F extends JSONSchemaEnumFragment ? JSONSchemaEnumFragmentReflect<TSchema, TName, F> : never)
  // Primitive type reflection
  | (TFragment extends infer F extends JSONSchemaPrimitiveTypeFragment ? JSONSchemaPrimitiveTypeFragmentReflect<TSchema, TName, F> : never)
  // Null type reflection
  | (TFragment extends infer F extends JSONSchemaNullTypeFragment ? JSONSchemaNullTypeFragmentReflect<TSchema, TName, F> : never)
  // Array type reflection
  | (TFragment extends infer F extends JSONSchemaArrayTypeFragment ? JSONSchemaArrayTypeFragmentReflect<TSchema, TName, F> : never)
  // Object type reflection
  | (TFragment extends infer F extends JSONSchemaObjectTypeFragment ? JSONSchemaObjectTypeFragmentReflect<TSchema, TName, F> : never)
  // AllOf type reflection
  | (TFragment extends infer F extends JSONSchemaAllOfTypeFragment ? JSONSchemaAllOfTypeFragmentReflect<TSchema, TName, F> : never)
  // AnyOf type reflection
  | (TFragment extends infer F extends JSONSchemaAnyOfTypeFragment ? JSONSchemaAnyOfTypeFragmentReflect<TSchema, TName, F> : never)
  // OneOf type reflection
  | (TFragment extends infer F extends JSONSchemaOneOfTypeFragment ? JSONSchemaOneOfTypeFragmentReflect<TSchema, TName, F> : never)
  // Not type reflection
  | (TFragment extends infer F extends JSONSchemaNotTypeFragment ? JSONSchemaNotTypeFragmentReflect<TSchema, TName, F> : never)
  // Reference reflection
  | (TFragment extends infer F extends JSONSchemaReferenceFragment ? JSONSchemaReferenceFragmentReflect<TSchema, TName, F> : never);

/**
 * Infers every reflection type an unspecified JSON schema fragment could match, as a union of reflection types
 */
type _JSONSchemaAnyFragmentReflection<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  | JSONSchemaModelFragmentReflect<TSchema, TName, TFragment & JSONSchemaModelFragment>
  | JSONSchemaConstFragmentReflect<TSchema, TName, TFragment & JSONSchemaConstFragment>
  | JSONSchemaEnumFragmentReflect<TSchema, TName, TFragment & JSONSchemaEnumFragment>
  | JSONSchemaPrimitiveTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaPrimitiveTypeFragment>
  | JSONSchemaNullTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaNullTypeFragment>
  | JSONSchemaArrayTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaArrayTypeFragment>
  | JSONSchemaObjectTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaObjectTypeFragment>
  | JSONSchemaAllOfTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaAllOfTypeFragment>
  | JSONSchemaAnyOfTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaAnyOfTypeFragment>
  | JSONSchemaOneOfTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaOneOfTypeFragment>
  | JSONSchemaNotTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaNotTypeFragment>
  | JSONSchemaReferenceFragmentReflect<TSchema, TName, TFragment & JSONSchemaReferenceFragment>;

/**
 * Infers the implicit any-of-types reflection of a `type` array split into several branches, holding a branch per group of type names, each with the
 * type independent keywords left out
 */
type _JSONSchemaImplicitAnyOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TBranch extends JSONSchemaNotCollectionFragment,
> = JSONSchemaAnyOfTypeFragmentReflect<
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
 * Infers the reflections of a fragment nested in another fragment, as the router returns them (see `JSONSchemaReflectedFragment`)
 */
export type JSONSchemaNestedFragmentReflections<TSchema extends JSONSchemaCollection, TFragment> = Array<
  JSONSchemaFragmentReflection<TSchema, undefined, JSONSchemaReflectedFragment<TFragment>>
>;

/**
 * Infers the reflections of each fragment in an array of nested fragments, element by element for a tuple
 */
export type JSONSchemaNestedFragmentsReflections<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  -readonly [I in keyof TFragments]: JSONSchemaNestedFragmentReflections<TSchema, TFragments[I]>;
};

/**
 * Gets the fragment type a value is reflected as: a (non-collection) fragment as is, an object of any other shape as the unspecified fragment, and
 * anything else (a boolean schema, an array) as `never`, i.e. with no reflections
 */
export type JSONSchemaReflectedFragment<T> =
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
