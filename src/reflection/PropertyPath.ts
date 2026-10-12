/**
 * Resolution of model properties over JSON schema fragment facets, as used by the TSSchema* reflection classes, and its type-level mirror.
 *
 * A property is looked up by a single property name in every "shape" reachable in one step from a fragment's facets: a model is a shape itself, a `$ref` is
 * resolved to the referenced fragment's shapes, the members of an `anyOf`, `oneOf` or `allOf` (implicit ones included, e.g. a nullable model) contribute
 * theirs, and an array contributes the shapes of its (single schema) `items`. An object with no `properties`, a `$ref` which can not be resolved, and
 * an array with no single schema `items` are of unknown shape, in which any (non empty) name is a property of unknown type, itself of unknown shape.
 */

import type {
  JSONSchema7,
  JSONSchemaCollection,
  JSONSchemaDefinitionName,
  JSONSchemaFragmentTypeBranch,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
  JSONSchemaObjectTypeFragment,
} from '../schema/JSONSchema/index.js';
import {
  JSONSchemaAllOfTypeFragmentFacet,
  JSONSchemaAnyOfTypeFragmentFacet,
  JSONSchemaArrayTypeFragmentFacet,
  JSONSchemaFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaObjectTypeFragmentFacet,
  JSONSchemaOneOfTypeFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
  isJSONSchemaObject,
} from './JSONSchema/index.js';

// #region Unknown shape

/**
 * Value of the `$comment` marking the fragment of a property of unknown shape (see `JSONSchemaUnknownShapeFragment`)
 */
export const JSONSchemaUnknownShapeComment = 'TSschema: property of unknown shape';

/**
 * Fragment of a property found in an object of unknown shape: an unconstrained schema (inferring `unknown`), marked by its `$comment` so that it is
 * itself treated as being of unknown shape
 */
export type JSONSchemaUnknownShapeFragment = { readonly $comment: typeof JSONSchemaUnknownShapeComment };

/**
 * Fragment of a property found in an object of unknown shape (see `JSONSchemaUnknownShapeFragment`)
 */
export const JSONSchemaUnknownShapeFragment: JSONSchemaUnknownShapeFragment = Object.freeze({ $comment: JSONSchemaUnknownShapeComment });

/**
 * Determines if a JSON fragment is the fragment of a property of unknown shape (see `JSONSchemaUnknownShapeFragment`)
 * @param fragment JSON fragment to check
 * @returns `true` if the fragment is marked as being of unknown shape
 */
export function isJSONSchemaUnknownShapeFragment(fragment: unknown): fragment is JSONSchemaUnknownShapeFragment {
  return isJSONSchemaObject(fragment) && (fragment as JSONSchema7).$comment === JSONSchemaUnknownShapeComment;
}

// #endregion

// #region Runtime resolution

/**
 * A shape reachable from a fragment's facets: a model facet, or `undefined` for a shape which is not known
 */
export type JSONSchemaPropertyShape = JSONSchemaModelFragmentFacet<any, any, any> | undefined;

/**
 * A property found by a name in one of the shapes reachable from a fragment's facets
 */
export type JSONSchemaPropertyMatch = {
  /**
   * The property's JSON fragment (as declared, so possibly a boolean schema), or `JSONSchemaUnknownShapeFragment` for a property of unknown shape
   */
  fragment: unknown;
  /**
   * Facets of the property's fragment, as held by its model
   */
  facets: Array<JSONSchemaFragmentFacet<any, any, any>>;
  /**
   * Whether the model the property was found in lists it as required (never for a property of unknown shape)
   */
  required: boolean;
};

/**
 * Gets every shape reachable in one step from a fragment's facets, each model once, and unknown shapes as a single `undefined`
 * @param facets Facets of the fragment
 * @param unknown Whether the fragment is itself of unknown shape
 * @returns Reachable shapes
 */
export function getJSONSchemaPropertyShapes(facets: ReadonlyArray<JSONSchemaFragmentFacet<any, any, any>>, unknown = false): Array<JSONSchemaPropertyShape> {
  const shapes = new Set<JSONSchemaPropertyShape>();
  if (unknown) shapes.add(undefined);
  _collectJSONSchemaPropertyShapes(facets, shapes, new Set());
  return [...shapes];
}

/**
 * Collects the shapes reachable from a fragment's facets, visiting each array of facets once (so that recursive references terminate)
 * @param facets Facets of the fragment
 * @param shapes Set to collect the shapes into
 * @param visited Arrays of facets already visited
 */
function _collectJSONSchemaPropertyShapes(
  facets: ReadonlyArray<JSONSchemaFragmentFacet<any, any, any>>,
  shapes: Set<JSONSchemaPropertyShape>,
  visited: Set<ReadonlyArray<unknown>>,
): void {
  if (visited.has(facets)) return;
  visited.add(facets);
  for (const facet of facets) {
    // Model: a shape itself
    if (facet instanceof JSONSchemaModelFragmentFacet) shapes.add(facet);
    // Object with no properties: of unknown shape
    else if (facet instanceof JSONSchemaObjectTypeFragmentFacet) shapes.add(undefined);
    // Reference: the referenced fragment's shapes, or of unknown shape if it can not be resolved
    else if (facet instanceof JSONSchemaReferenceFragmentFacet) {
      const ref = facet.ref as ReadonlyArray<JSONSchemaFragmentFacet<any, any, any>> | undefined;
      if (ref === undefined) shapes.add(undefined);
      else _collectJSONSchemaPropertyShapes(ref, shapes, visited);
    }
    // Combinators: every member's shapes (a member marked as being of unknown shape contributes an unknown shape)
    else if (
      facet instanceof JSONSchemaAnyOfTypeFragmentFacet ||
      facet instanceof JSONSchemaOneOfTypeFragmentFacet ||
      facet instanceof JSONSchemaAllOfTypeFragmentFacet
    ) {
      const [members, fragments] =
        facet instanceof JSONSchemaAnyOfTypeFragmentFacet
          ? [facet.anyOf, facet.fragment.anyOf]
          : facet instanceof JSONSchemaOneOfTypeFragmentFacet
            ? [facet.oneOf, facet.fragment.oneOf]
            : [facet.allOf, facet.fragment.allOf];
      (members as Array<ReadonlyArray<JSONSchemaFragmentFacet<any, any, any>>>).forEach((member, i) => {
        if (isJSONSchemaUnknownShapeFragment(fragments[i])) shapes.add(undefined);
        else _collectJSONSchemaPropertyShapes(member, shapes, visited);
      });
    }
    // Array: the shapes of its (single schema) items, or of unknown shape if it has none
    else if (facet instanceof JSONSchemaArrayTypeFragmentFacet) {
      if (isJSONSchemaObject(facet.fragment.items))
        _collectJSONSchemaPropertyShapes(facet.items as ReadonlyArray<JSONSchemaFragmentFacet<any, any, any>>, shapes, visited);
      else shapes.add(undefined);
    }
  }
}

/**
 * Determines if any model among the reachable shapes defines a property by the exact name
 * @param shapes Reachable shapes (see `getJSONSchemaPropertyShapes`)
 * @param name Property name
 * @returns `true` if a model defines the property
 */
export function hasJSONSchemaPropertyShapesName(shapes: ReadonlyArray<JSONSchemaPropertyShape>, name: string): boolean {
  return shapes.some((shape) => shape !== undefined && (shape.names as Array<string>).includes(name));
}

/**
 * Gets the names of all properties defined by the models among the reachable shapes, in order of first appearance
 * @param shapes Reachable shapes (see `getJSONSchemaPropertyShapes`)
 * @returns Property names
 */
export function getJSONSchemaPropertyShapesNames(shapes: ReadonlyArray<JSONSchemaPropertyShape>): Array<string> {
  return [...new Set(shapes.flatMap((shape) => (shape === undefined ? [] : (shape.names as Array<string>))))];
}

/**
 * Finds a property by its exact name in every reachable shape: each model defining it contributes the property, and an unknown shape contributes a
 * property of unknown shape (unless the name is empty)
 * @param shapes Reachable shapes (see `getJSONSchemaPropertyShapes`)
 * @param name Property name
 * @returns Every property found
 */
export function getJSONSchemaPropertyMatches(shapes: ReadonlyArray<JSONSchemaPropertyShape>, name: string): Array<JSONSchemaPropertyMatch> {
  return shapes.flatMap((shape): Array<JSONSchemaPropertyMatch> => {
    // Unknown shape: any non empty name is a property of unknown shape
    if (shape === undefined) return name === '' ? [] : [{ fragment: JSONSchemaUnknownShapeFragment, facets: [], required: false }];
    // Model not defining the property
    if (!(shape.names as Array<string>).includes(name)) return [];
    // Model defining the property
    return [
      {
        fragment: (shape.fragment.properties as Record<string, unknown>)[name],
        facets: (shape.properties as Record<string, Array<JSONSchemaFragmentFacet<any, any, any>>>)[name],
        required: (shape.required as Array<string>).includes(name),
      },
    ];
  });
}

// #endregion

// #region Type-level resolution

/**
 * Marks an unknown shape among the shapes inferred by `_JSONSchemaPropertyShape`
 */
type _JSONSchemaUnknownShape = { readonly __unknownShape: true };

/**
 * Infers every shape reachable in one step from a JSON schema fragment: model fragments, and `_JSONSchemaUnknownShape` for unknown shapes. The type-level
 * mirror of `getJSONSchemaPropertyShapes`.
 */
type _JSONSchemaPropertyShape<TFragment, TSchema extends JSONSchemaCollection, TVisited = never> =
  // Distribute over a union of fragments
  TFragment extends unknown
    ? // Property of unknown shape
      TFragment extends JSONSchemaUnknownShapeFragment
      ? _JSONSchemaUnknownShape
      : // Distribute over the branches of a type array
        JSONSchemaFragmentTypeBranch<TFragment> extends infer B
        ? B extends unknown
          ? _JSONSchemaPropertyShapeOfBranch<B, TSchema, TVisited>
          : never
        : never
    : never;
/**
 * Infers every shape reachable in one step from a single (non-union, unsplit) JSON schema fragment, as the union of each keyword's shapes
 */
type _JSONSchemaPropertyShapeOfBranch<TFragment, TSchema extends JSONSchemaCollection, TVisited> =
  // Model: a shape itself
  | (TFragment extends JSONSchemaModelFragment ? TFragment : never)
  // Object with no properties: of unknown shape
  | (TFragment extends JSONSchemaObjectTypeFragment ? _JSONSchemaUnknownShape : never)
  // Reference: the referenced fragment's shapes, or of unknown shape if it can not be resolved
  | (TFragment extends { $ref: infer P extends string } ? _JSONSchemaPropertyShapeOfReference<P, TSchema, TVisited> : never)
  // Combinators: every member's shapes
  | (TFragment extends { anyOf: infer U extends ReadonlyArray<unknown> } ? _JSONSchemaPropertyShape<U[number], TSchema, TVisited> : never)
  | (TFragment extends { oneOf: infer U extends ReadonlyArray<unknown> } ? _JSONSchemaPropertyShape<U[number], TSchema, TVisited> : never)
  | (TFragment extends { allOf: infer U extends ReadonlyArray<unknown> } ? _JSONSchemaPropertyShape<U[number], TSchema, TVisited> : never)
  // Array: the shapes of its (single schema) items, or of unknown shape if it has none
  | (TFragment extends { type: 'array' }
      ? TFragment extends { items: infer I extends JSONSchemaNotCollectionFragment }
        ? _JSONSchemaPropertyShape<I, TSchema, TVisited>
        : _JSONSchemaUnknownShape
      : never);
/**
 * Infers the shapes of the fragment a `$ref` points to. A reference which can not be resolved (no collection is known, the reference is not
 * `#/$defs/<name>`, or the collection has no such fragment) is of unknown shape, and a fragment already visited contributes nothing more.
 */
type _JSONSchemaPropertyShapeOfReference<TRef extends string, TSchema extends JSONSchemaCollection, TVisited> =
  // No collection is known: can not be resolved
  JSONSchemaCollection extends TSchema
    ? _JSONSchemaUnknownShape
    : // Reference to a fragment of the collection
      TRef extends `#/$defs/${infer N}`
      ? N extends JSONSchemaDefinitionName<TSchema>
        ? // Already visited
          N extends TVisited
          ? never
          : _JSONSchemaPropertyShape<TSchema['$defs'][N], TSchema, TVisited | N>
        : _JSONSchemaUnknownShape
      : // Any other reference: can not be resolved
        _JSONSchemaUnknownShape;

/**
 * Infers the names of all properties defined by the models reachable in one step from a JSON schema fragment. The type-level mirror of
 * `getJSONSchemaPropertyShapesNames`.
 */
export type JSONSchemaReachablePropertyName<TFragment, TSchema extends JSONSchemaCollection> =
  _JSONSchemaPropertyShape<TFragment, TSchema> extends infer S ? (S extends JSONSchemaModelFragment ? keyof S['properties'] & string : never) : never;

/**
 * Infers if an unknown shape is reachable in one step from a JSON schema fragment, so that any name addresses a property
 */
export type JSONSchemaPropertyShapeIsUnknown<TFragment, TSchema extends JSONSchemaCollection> =
  _JSONSchemaUnknownShape extends _JSONSchemaPropertyShape<TFragment, TSchema> ? true : false;

/**
 * Infers every property found by its exact name in the shapes reachable in one step from a JSON schema fragment, as a union of `{ shape, fragment }`
 * pairs: pairing each property with the shape it was found in keeps properties of the same type found in different models apart, as they are at
 * runtime. A boolean schema property infers the empty schema, and a property of an unknown shape `JSONSchemaUnknownShapeFragment`. The type-level mirror
 * of `getJSONSchemaPropertyMatches`.
 */
type _JSONSchemaPropertyMatch<TFragment, TSchema extends JSONSchemaCollection, TName extends string> =
  _JSONSchemaPropertyShape<TFragment, TSchema> extends infer S
    ? S extends unknown
      ? // Unknown shape: any non empty name is a property of unknown shape
        S extends _JSONSchemaUnknownShape
        ? TName extends ''
          ? never
          : { shape: S; fragment: JSONSchemaUnknownShapeFragment }
        : // Model defining the property
          S extends JSONSchemaModelFragment
          ? TName extends keyof S['properties']
            ? Exclude<S['properties'][TName], undefined> extends infer P
              ? { shape: S; fragment: P extends JSONSchemaNotCollectionFragment ? P : {} }
              : never
            : never
          : never
      : never
    : never;

/**
 * Infers the fragment of the property found by its exact name in the shapes reachable in one step from a JSON schema fragment: the property's own
 * fragment if it was found once, an implicit `anyOf` of every property's fragment if it was found several times, or `never` if it was not found
 */
export type JSONSchemaPropertyFragment<TFragment, TSchema extends JSONSchemaCollection, TName extends string> =
  _JSONSchemaPropertyMatch<TFragment, TSchema, TName> extends infer M extends { fragment: unknown }
    ? // Not found
      [M] extends [never]
      ? never
      : // Found several times
        true extends _IsUnion<M>
        ? { readonly anyOf: ReadonlyArray<M['fragment']> }
        : // Found once
          M['fragment']
    : never;

/**
 * Determines if a type is a union of several types, resolving to `boolean` for a union, and `false` otherwise
 */
type _IsUnion<T, TAll = T> = T extends unknown ? ([TAll] extends [T] ? false : true) : never;

// #endregion
