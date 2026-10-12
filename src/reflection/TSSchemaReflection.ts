/**
 * Runtime reflection of JSON schemas: reflections of a schema's fragments, each holding all facets its fragment was parsed into.
 *
 * `reflect` reflects a schema's root, from which its definitions (`$defs`) and properties are reflected in turn. A fragment reflection
 * (`TSSchemaFragmentReflection`) is the base class of the reflection of a definition (`TSSchemaDefinitionReflection`) and of a property
 * (`TSSchemaPropertyReflection`). All three live in this file on purpose: both subclasses extend the base class at the top level of the module, while
 * the base class creates instances of both, which split into several files would be an import cycle throwing a TDZ `ReferenceError`.
 */

import type {
  JSONSchema7,
  JSONSchemaCollection,
  JSONSchemaDefinitionName,
  JSONSchemaFragmentType,
  JSONSchemaNotCollectionFragment,
} from '../schema/JSONSchema/index.js';
import {
  JSONSchemaAnyOfTypeFragmentFacet,
  JSONSchemaCollectionFragmentFacet,
  parseJSONSchema,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentFacet,
  type JSONSchemaFragmentFacetOf,
  type JSONSchemaParsedFragment,
} from './JSONSchema/index.js';
import {
  getJSONSchemaPropertyMatches,
  getJSONSchemaPropertyShapes,
  getJSONSchemaPropertyShapesNames,
  hasJSONSchemaPropertyShapesName,
  isJSONSchemaUnknownShapeFragment,
  type JSONSchemaPropertyFragment,
  type JSONSchemaReachablePropertyName,
  type JSONSchemaPropertyShapeIsUnknown,
} from './PropertyPath.js';
import { getTSSchemaTypeDescriptor, type TSSchemaTypeDescriptorOf } from './TypeDescriptor.js';

// #region Entry point

/**
 * Reflects a JSON schema's root fragment. A collection (a schema with `$defs`) is reflected as its root fragment (the schema with its `$defs` left
 * out), with the collection as the collection its definitions are reflected from and every `$ref` is resolved against; any other schema is reflected as
 * is, with no collection.
 * @param schema JSON schema to reflect
 * @returns Reflection of the schema's root fragment
 */
export function reflect<TSchema extends JSONSchema7>(schema: TSchema): TSSchemaFragmentReflection<_ReflectedSchema<TSchema>, _ReflectedFragment<TSchema>> {
  const facets = parseJSONSchema(schema) as Array<JSONSchemaFragmentFacet<any, any, any>>;
  const collection = facets.find((facet) => facet instanceof JSONSchemaCollectionFragmentFacet);
  return new TSSchemaFragmentReflection(facets.filter((facet) => facet !== collection) as Array<any>, { collection }) as TSSchemaFragmentReflection<
    _ReflectedSchema<TSchema>,
    _ReflectedFragment<TSchema>
  >;
}

/**
 * Infers the collection a reflected schema's fragments belong to: the schema itself if it is a collection, the unspecified collection otherwise
 */
type _ReflectedSchema<TSchema extends JSONSchema7> = TSchema extends JSONSchemaCollection ? TSchema : JSONSchemaCollection;

/**
 * Infers the fragment a reflected schema's root is reflected as: the root fragment of a collection, the schema itself otherwise
 */
type _ReflectedFragment<TSchema extends JSONSchema7> =
  // Collection
  TSchema extends JSONSchemaCollection
    ? JSONSchemaCollectionRootFragment<TSchema>
    : // Any other schema
      TSchema extends JSONSchemaNotCollectionFragment
      ? TSchema
      : never;

// #endregion

// #region Fragment reflection

/**
 * Options of a reflection: the collection it is reflected in, and what is known about the reflected fragment beyond its facets
 */
export type TSSchemaReflectionOptions<TSchema extends JSONSchemaCollection, TName> = {
  /**
   * Facet of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   */
  collection?: JSONSchemaCollectionFragmentFacet<TSchema>;
  /**
   * Name of the reflection: the definition's name, or the property's name
   */
  name?: TName;
  /**
   * Whether the fragment is a property of unknown shape (see `JSONSchemaUnknownShapeFragment`)
   */
  unknown?: boolean;
};

/**
 * Reflects a JSON schema fragment, by all facets its fragment was parsed into: the base class of every reflection, and the reflection of a schema's
 * root (see `reflect`). Gives access to the definitions of the collection the fragment belongs to, and to the properties of every model reachable from
 * the fragment (through `$ref`s, `anyOf` / `oneOf` / `allOf` members, and the `items` of an array).
 */
export class TSSchemaFragmentReflection<
  TSchema extends JSONSchemaCollection = JSONSchemaCollection,
  TFragment extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
  TName = undefined,
  TFacetName extends JSONSchemaDefinitionName<TSchema> | undefined = undefined,
> {
  /**
   * Value type inferred from the reflected fragment (see `JSONSchemaFragmentType`). Only meant for type inference, as `typeof reflection.Type`: it holds
   * no value, and throws if accessed at runtime.
   */
  public get Type(): JSONSchemaFragmentType<TFragment, TSchema> {
    throw new Error('This accessor should never be accessed, it is only meant to be used for type inference convenience: `typeof reflection.Type`');
  }

  /**
   * Name of the reflection: `undefined` for a schema's root, the definition's name for a definition, and the property's name for a property
   */
  public get name(): TName {
    return this._name;
  }

  /**
   * Facets the reflected fragment was parsed into
   */
  public get facets(): Array<JSONSchemaFragmentFacetOf<TSchema, TFacetName, TFragment>> {
    return this._facets;
  }

  /**
   * Facet of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   */
  public get collection(): JSONSchemaCollectionFragmentFacet<TSchema> | undefined {
    return this._collection;
  }

  /**
   * Describes the type of the reflected fragment (see `TSSchemaTypeDescriptor`): a tree of plain objects, told apart by their `kind`, built from the
   * fragment's facets on first access. Every reference to a definition describes it by the same descriptor, which is also the definition reflection's.
   */
  public get typeDescriptor(): TSSchemaTypeDescriptorOf<TSchema, TFragment> {
    return getTSSchemaTypeDescriptor(this._facets) as TSSchemaTypeDescriptorOf<TSchema, TFragment>;
  }

  /**
   * Names of all definitions of the collection the fragment belongs to, or an empty array if the reflected schema has no `$defs`
   */
  public get definitionNames(): Array<JSONSchemaDefinitionName<TSchema>> {
    return this._collection?.names ?? [];
  }

  /**
   * Names of all properties of every model reachable from the fragment, in order of first appearance. A property of unknown shape (e.g. of an object
   * with no `properties`) has no known names, though any name addresses a property of it.
   */
  public get propertyNames(): Array<_TSSchemaReflectionPropertyName<TSchema, TFragment>> {
    return getJSONSchemaPropertyShapesNames(getJSONSchemaPropertyShapes(this._facets, this._unknown)) as Array<
      _TSSchemaReflectionPropertyName<TSchema, TFragment>
    >;
  }

  /**
   * Facets the reflected fragment was parsed into
   */
  protected _facets: Array<JSONSchemaFragmentFacetOf<TSchema, TFacetName, TFragment>>;

  /**
   * Facet of the JSON schema collection the fragment belongs to, or `undefined` if the reflected schema has no `$defs`
   */
  protected _collection: JSONSchemaCollectionFragmentFacet<TSchema> | undefined;

  /**
   * Name of the reflection
   */
  protected _name: TName;

  /**
   * Whether the fragment is a property of unknown shape
   */
  protected _unknown: boolean;

  /**
   * Reflects a JSON schema fragment, by its facets. Reflections are meant to be created by `reflect`, `getDefinition` and `getProperty`.
   * @param facets Facets the fragment was parsed into
   * @param options Collection, name and shape of the reflected fragment (see `TSSchemaReflectionOptions`)
   */
  public constructor(
    facets: Array<JSONSchemaFragmentFacetOf<TSchema, TFacetName, TFragment>>,
    { collection, name, unknown }: TSSchemaReflectionOptions<TSchema, TName> = {},
  ) {
    this._facets = facets;
    this._collection = collection;
    this._name = name as TName;
    this._unknown = unknown ?? false;
  }

  /**
   * Reflects a definition of the collection the fragment belongs to
   * @param name Name of the definition
   * @returns Reflection of the definition, or `undefined` if the collection has no such definition (or the reflected schema has no `$defs`)
   */
  public getDefinition<TDefinitionName extends JSONSchemaDefinitionName<TSchema>>(
    name: TDefinitionName,
  ): _TSSchemaReflectionDefinition<TSchema, TDefinitionName> {
    const facets = this._collection?.$defs[name];
    return (
      facets === undefined ? undefined : new TSSchemaDefinitionReflection(facets as Array<any>, { collection: this._collection, name })
    ) as _TSSchemaReflectionDefinition<TSchema, TDefinitionName>;
  }

  /**
   * Reflects a property of the models reachable from the fragment, by its name, or by a dot-separated path into nested models (e.g. `'address.city'`).
   *
   * A name is looked up in every model reachable from the fragment, through `$ref`s, `anyOf` / `oneOf` / `allOf` members, and the `items` of an array. A
   * property found in several models is reflected as one property, holding an implicit `anyOf` of each found property's fragment, and required only if
   * every model it was found in requires it. Within an object of unknown shape (an object with no `properties`, a `$ref` which can not be resolved, an
   * array with no single schema `items`), any non empty name is a property of unknown type and shape.
   *
   * A name defined exactly by any reachable model is looked up as is, even if it contains a dot; otherwise a path is split at its first dot, and its
   * remainder looked up in the property named by its first segment, which becomes the found property's `parent`.
   * @param path Name or dot-separated path of the property
   * @returns Reflection of the property, or `undefined` if the fragment has no such property
   */
  public getProperty<TPath extends _TSSchemaReflectionPropertyPath<TSchema, TFragment>>(
    path: TPath,
  ): _TSSchemaReflectionProperty<TSchema, TFragment, TPath, this> {
    return this._getProperty(path) as _TSSchemaReflectionProperty<TSchema, TFragment, TPath, this>;
  }

  /**
   * Reflects a property of the models reachable from the fragment, by its name or a dot-separated path (see `getProperty`)
   * @param path Name or dot-separated path of the property
   * @returns Reflection of the property, or `undefined` if the fragment has no such property
   */
  protected _getProperty(path: string): TSSchemaPropertyReflection<TSchema, any, string, any> | undefined {
    const shapes = getJSONSchemaPropertyShapes(this._facets, this._unknown);
    // Path not defined as a property name by any model: look up its remainder in the property named by its first segment
    const dot = path.indexOf('.');
    if (dot !== -1 && !hasJSONSchemaPropertyShapesName(shapes, path)) return this._getProperty(path.slice(0, dot))?._getProperty(path.slice(dot + 1));
    // Property name: reflect the property found, or every property found as one
    const matches = getJSONSchemaPropertyMatches(shapes, path);
    if (matches.length === 0) return undefined;
    if (matches.length === 1) {
      const [match] = matches;
      return new TSSchemaPropertyReflection(match.facets as Array<any>, {
        collection: this._collection,
        name: path,
        unknown: isJSONSchemaUnknownShapeFragment(match.fragment),
        parent: this,
        required: match.required,
      });
    }
    const anyOf = new JSONSchemaAnyOfTypeFragmentFacet({ anyOf: matches.map((match) => match.fragment) } as any, {
      collection: this._collection,
      implicit: true,
    });
    return new TSSchemaPropertyReflection([anyOf] as Array<any>, {
      collection: this._collection,
      name: path,
      parent: this,
      required: matches.every((match) => match.required),
    });
  }
}

/**
 * Infers the names of all properties of every model reachable from a reflected fragment, or any name for the unspecified fragment
 */
type _TSSchemaReflectionPropertyName<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaNotCollectionFragment> =
  // Unspecified fragment: any name
  JSONSchemaNotCollectionFragment extends TFragment ? string : JSONSchemaReachablePropertyName<TFragment, TSchema>;

/**
 * Infers the names and paths `getProperty` accepts: the name of a property of a reachable model, optionally followed by a dot and the remainder of a path,
 * or any name and path if an unknown shape is reachable (or the fragment is unspecified). Only a path's first segment is checked, as a recursive schema
 * has infinitely many valid paths.
 */
type _TSSchemaReflectionPropertyPath<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaNotCollectionFragment> =
  // Unspecified fragment: any name and path
  JSONSchemaNotCollectionFragment extends TFragment
    ? string
    : // Unknown shape reachable: any name and path
      JSONSchemaPropertyShapeIsUnknown<TFragment, TSchema> extends true
      ? string
      : // Property name of a reachable model, or a path starting with one
        JSONSchemaReachablePropertyName<TFragment, TSchema> | `${JSONSchemaReachablePropertyName<TFragment, TSchema>}.${string}`;

/**
 * Infers the reflection of a definition, or `undefined` if the collection is unspecified (so that the definition may not exist)
 */
type _TSSchemaReflectionDefinition<TSchema extends JSONSchemaCollection, TName extends JSONSchemaDefinitionName<TSchema>> =
  // Unspecified collection: the definition may not exist
  JSONSchemaCollection extends TSchema ? TSSchemaDefinitionReflection<TSchema, TName> | undefined : TSSchemaDefinitionReflection<TSchema, TName>;

/**
 * Infers the reflection of the property addressed by a name or dot-separated path, or `undefined` if there is no such property. The type-level mirror of
 * `_getProperty`.
 */
type _TSSchemaReflectionProperty<TSchema extends JSONSchemaCollection, TFragment, TPath extends string, TParent> =
  // Unspecified fragment: any property, of any fragment
  JSONSchemaNotCollectionFragment extends TFragment
    ? TSSchemaPropertyReflection<TSchema, JSONSchemaNotCollectionFragment, string, TSSchemaFragmentReflection<TSchema, any, any, any>> | undefined
    : // Property name defined by a reachable model
      TPath extends JSONSchemaReachablePropertyName<TFragment, TSchema>
      ? _TSSchemaReflectionPropertyByName<TSchema, TFragment, TPath, TParent>
      : // Path: look up its remainder in the property named by its first segment
        TPath extends `${infer H}.${infer R}`
        ? _TSSchemaReflectionPropertyByName<TSchema, TFragment, H, TParent> extends infer P
          ? P extends TSSchemaPropertyReflection<TSchema, any, string, any>
            ? _TSSchemaReflectionProperty<TSchema, JSONSchemaPropertyFragment<TFragment, TSchema, H>, R, P>
            : undefined
          : never
        : // Property name of an unknown shape, or of no property at all
          _TSSchemaReflectionPropertyByName<TSchema, TFragment, TPath, TParent>;

/**
 * Infers the reflection of the property found by its exact name, or `undefined` if there is no such property
 */
type _TSSchemaReflectionPropertyByName<TSchema extends JSONSchemaCollection, TFragment, TName extends string, TParent> =
  JSONSchemaPropertyFragment<TFragment, TSchema, TName> extends infer F
    ? // Not found
      [F] extends [never]
      ? undefined
      : // Found
        F extends JSONSchemaNotCollectionFragment
        ? TSSchemaPropertyReflection<TSchema, F, TName, TParent>
        : never
    : never;

// #endregion

// #region Definition reflection

/**
 * Reflects a definition of a JSON schema collection (a fragment of its `$defs`), named by its definition name
 */
export class TSSchemaDefinitionReflection<
  TSchema extends JSONSchemaCollection = JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> = JSONSchemaDefinitionName<TSchema>,
> extends TSSchemaFragmentReflection<TSchema, _TSSchemaDefinitionFragment<TSchema, TName>, TName, TName> {}

/**
 * Gets the fragment of a collection's definition, as the collection facet parses it (see `JSONSchemaParsedFragment`)
 */
type _TSSchemaDefinitionFragment<TSchema extends JSONSchemaCollection, TName extends JSONSchemaDefinitionName<TSchema>> = JSONSchemaParsedFragment<
  TSchema['$defs'][TName]
>;

// #endregion

// #region Property reflection

/**
 * Options of a property reflection: those of every reflection (see `TSSchemaReflectionOptions`), plus the reflection the property was found from and
 * whether it is required
 */
export type TSSchemaPropertyReflectionOptions<TSchema extends JSONSchemaCollection, TName, TParent> = TSSchemaReflectionOptions<TSchema, TName> & {
  /**
   * Reflection the property was found from
   */
  parent: TParent;
  /**
   * Whether every model the property was found in requires it
   */
  required: boolean;
};

/**
 * Reflects a property of a model, named by its property name, together with the reflection it was found from and whether it is required. A property found in
 * several models (e.g. members of an `anyOf`) is reflected as one property, holding an implicit `anyOf` of each found property's fragment.
 */
export class TSSchemaPropertyReflection<
  TSchema extends JSONSchemaCollection = JSONSchemaCollection,
  TFragment extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
  TName extends string = string,
  TParent = TSSchemaFragmentReflection<TSchema, any, any, any>,
> extends TSSchemaFragmentReflection<TSchema, TFragment, TName, undefined> {
  /**
   * Reflection the property was found from: the reflection `getProperty` was called on for a property name, or of the property named by all but the last
   * segment of a path (so that `getProperty('a.b').parent` reflects the same property as `getProperty('a')`)
   */
  public get parent(): TParent {
    return this._parent;
  }

  /**
   * Whether the property is required: listed in the `required` keyword of every model it was found in (never for a property of unknown shape)
   */
  public get required(): boolean {
    return this._required;
  }

  /**
   * Reflection the property was found from
   */
  protected _parent: TParent;

  /**
   * Whether the property is required
   */
  protected _required: boolean;

  /**
   * Reflects a property, by its facets
   * @param facets Facets the property's fragment was parsed into
   * @param options Collection and name of the property, the reflection it was found from, and whether it is required (see
   * `TSSchemaPropertyReflectionOptions`)
   */
  public constructor(
    facets: Array<JSONSchemaFragmentFacetOf<TSchema, undefined, TFragment>>,
    options: TSSchemaPropertyReflectionOptions<TSchema, TName, TParent>,
  ) {
    super(facets, options);
    this._parent = options.parent;
    this._required = options.required;
  }
}

// #endregion
