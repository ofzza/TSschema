/**
 * Type descriptors: a runtime description of the type of a JSON schema fragment, built from the facets the fragment was parsed into.
 *
 * Facets are keyword shaped (one per matching keyword, all applying at once); a type descriptor is type shaped: a tree of plain objects told apart by
 * their `kind`, describing what `TSSchemaType` infers at type level. `getTSSchemaTypeDescriptor` builds it at runtime, and `TSSchemaTypeDescriptorOf`
 * infers the same descriptor, with literal kinds, values, names and property keys, at type level.
 *
 * This file imports facets only, never a reflection class, so it stays out of the reflection classes' import cycle.
 */

import type {
  JSONSchemaCollection,
  JSONSchemaDefinitionName,
  JSONSchemaNotCollectionFragment,
  JSONSchemaPrimitiveTypeName,
} from '../schema/JSONSchema/index.js';
import {
  JSONSchemaAllOfTypeFragmentFacet,
  JSONSchemaAnyOfTypeFragmentFacet,
  JSONSchemaArrayTypeFragmentFacet,
  JSONSchemaConstFragmentFacet,
  JSONSchemaEnumFragmentFacet,
  JSONSchemaModelFragmentFacet,
  JSONSchemaNotTypeFragmentFacet,
  JSONSchemaNullTypeFragmentFacet,
  JSONSchemaObjectTypeFragmentFacet,
  JSONSchemaOneOfTypeFragmentFacet,
  JSONSchemaPrimitiveTypeFragmentFacet,
  JSONSchemaReferenceFragmentFacet,
  getJSONSchemaValueName,
  type JSONSchemaCollectionParsedFragment,
  type JSONSchemaFragmentFacet,
  type JSONSchemaFragmentFacetOf,
  type JSONSchemaParsedFragment,
  type JSONSchemaValueName,
} from './JSONSchema/index.js';

// #region Descriptors

/**
 * Describes the type of a JSON schema fragment at runtime, as one of the descriptor kinds below, told apart by `kind`
 */
export type TSSchemaTypeDescriptor =
  | TSSchemaUnknownTypeDescriptor
  | TSSchemaConstTypeDescriptor
  | TSSchemaEnumTypeDescriptor
  | TSSchemaPrimitiveTypeDescriptor
  | TSSchemaNullTypeDescriptor
  | TSSchemaArrayTypeDescriptor
  | TSSchemaRecordTypeDescriptor
  | TSSchemaModelTypeDescriptor
  | TSSchemaReferenceTypeDescriptor
  | TSSchemaAnyOfTypeDescriptor
  | TSSchemaAllOfTypeDescriptor
  | TSSchemaOneOfTypeDescriptor
  | TSSchemaNotTypeDescriptor;

/**
 * Describes a type with no known constraint: a fragment with no keywords describing a type, a boolean schema, or a `$ref` which can not be resolved
 */
export interface TSSchemaUnknownTypeDescriptor {
  readonly kind: 'unknown';
}

/**
 * Describes a single constant value (`const`)
 */
export interface TSSchemaConstTypeDescriptor<TValue = unknown> {
  readonly kind: 'const';
  readonly value: TValue;
}

/**
 * Describes a set of enumerated values, each with a name: an `enum` (named by its `x-enumNames`, or else each value by its own name), or a `oneOf` of
 * `const` fragments (named by each fragment's `title`, or else by its own name)
 */
export interface TSSchemaEnumTypeDescriptor<
  TValues extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
  TNames extends ReadonlyArray<string> = ReadonlyArray<string>,
> {
  readonly kind: 'enum';
  /**
   * The enumerated values, in order
   */
  readonly values: TValues;
  /**
   * The name of each enumerated value, in the same order
   */
  readonly names: TNames;
}

/**
 * Describes a primitive type (`string`, `number`, `integer` or `boolean`). A `type` array naming several is described as an implicit `anyOf` of them.
 */
export interface TSSchemaPrimitiveTypeDescriptor<TType extends JSONSchemaPrimitiveTypeName = JSONSchemaPrimitiveTypeName> {
  readonly kind: 'primitive';
  readonly type: TType;
}

/**
 * Describes the `null` type
 */
export interface TSSchemaNullTypeDescriptor {
  readonly kind: 'null';
}

/**
 * Describes an array, by the type of its items
 */
export interface TSSchemaArrayTypeDescriptor<TItems = TSSchemaTypeDescriptor> {
  readonly kind: 'array';
  /**
   * Type of every item: `unknown` if the array has no `items`, or no single schema `items`
   */
  readonly items: TItems;
  // TODO: Not implemented yet (as in the facet and type layers): tuples (`prefixItems`), described as an array of `unknown` items for now
}

/**
 * Describes an object with no known properties (`type: "object"` without `properties`), by the type of its values
 */
export interface TSSchemaRecordTypeDescriptor<TValues = TSSchemaTypeDescriptor> {
  readonly kind: 'record';
  /**
   * Type of every value: always `unknown` for now
   */
  readonly values: TValues;
  // TODO: Not implemented yet (as in the facet and type layers): `additionalProperties`, describing the type of the values
}

/**
 * Describes a model (`type: "object"` with `properties`), by the type of each of its properties, and which of them are required
 */
export interface TSSchemaModelTypeDescriptor<
  TProperties = { readonly [name: string]: TSSchemaTypeDescriptor },
  TRequired extends ReadonlyArray<string> = ReadonlyArray<string>,
> {
  readonly kind: 'model';
  /**
   * Type of each property, by property name
   */
  readonly properties: TProperties;
  /**
   * Names of the required properties (every other property is optional)
   */
  readonly required: TRequired;
}

/**
 * Describes a reference (`$ref`) to a definition of the collection, by the definition's name and type. The type is described lazily, on first access to
 * `target`, as (in)directly recursive references would otherwise never finish describing.
 */
export interface TSSchemaReferenceTypeDescriptor<TName extends string = string, TTarget = TSSchemaTypeDescriptor> {
  readonly kind: 'reference';
  /**
   * Name of the referenced definition
   */
  readonly name: TName;
  /**
   * Type of the referenced definition: the same descriptor (by identity) for every reference to the same definition
   */
  readonly target: TTarget;
}

/**
 * Describes a union of types (`anyOf`), by its members. An implicit `anyOf` holds the branches of a `type` array naming several types, or the fragments of
 * a property found in several models.
 */
export interface TSSchemaAnyOfTypeDescriptor<
  TMembers extends ReadonlyArray<unknown> = ReadonlyArray<TSSchemaTypeDescriptor>,
  TImplicit extends boolean = boolean,
> {
  readonly kind: 'anyOf';
  readonly members: TMembers;
  /**
   * Whether the `anyOf` is implicit, rather than an `anyOf` keyword of the schema
   */
  readonly implicit: TImplicit;
}

/**
 * Describes an intersection of types (`allOf`), by its members. An implicit `allOf` holds the descriptors of several keywords of one fragment (e.g. a
 * `$ref` alongside `properties`), which all apply at once.
 */
export interface TSSchemaAllOfTypeDescriptor<
  TMembers extends ReadonlyArray<unknown> = ReadonlyArray<TSSchemaTypeDescriptor>,
  TImplicit extends boolean = boolean,
> {
  readonly kind: 'allOf';
  readonly members: TMembers;
  /**
   * Whether the `allOf` is implicit, combining several keywords of one fragment, rather than an `allOf` keyword of the schema
   */
  readonly implicit: TImplicit;
}

/**
 * Describes an exclusive union of types (`oneOf`), by its members. A `oneOf` of `const` fragments only is described as an enum instead.
 */
export interface TSSchemaOneOfTypeDescriptor<TMembers extends ReadonlyArray<unknown> = ReadonlyArray<TSSchemaTypeDescriptor>> {
  readonly kind: 'oneOf';
  readonly members: TMembers;
}

/**
 * Describes the negation of a type (`not`)
 */
export interface TSSchemaNotTypeDescriptor<TNot = TSSchemaTypeDescriptor> {
  readonly kind: 'not';
  readonly not: TNot;
}

// #endregion

// #region Runtime

/**
 * Descriptors already built, by the facets array they describe, so that every reference to a definition describes it by the same descriptor
 */
const _descriptors = new WeakMap<ReadonlyArray<JSONSchemaFragmentFacet<any, any, any>>, TSSchemaTypeDescriptor>();

/**
 * Describes the type of a JSON schema fragment, by all facets it was parsed into. A fragment with no facet describing a type is `unknown`, one with a
 * single facet is described by it, and one with several by an implicit `allOf` of them, except that an `enum` or `const` absorbs the facets of
 * `type` alongside it (e.g. `type: "string", enum: [...]` is just an enum). The runtime counterpart of `TSSchemaTypeDescriptorOf`.
 *
 * Descriptors are cached by facets array, so describing the same facets twice returns the same descriptor.
 * @param facets Facets the fragment was parsed into
 * @returns Descriptor of the fragment's type
 */
export function getTSSchemaTypeDescriptor<TFacet extends JSONSchemaFragmentFacet<any, any, any>>(
  facets: ReadonlyArray<TFacet>,
): TSSchemaFacetsTypeDescriptor<TFacet> {
  const cached = _descriptors.get(facets);
  if (cached !== undefined) return cached as TSSchemaFacetsTypeDescriptor<TFacet>;
  const descriptor = _combineTSSchemaTypeDescriptors(facets.map((facet) => _describeFacet(facet)).filter((descriptor) => descriptor !== undefined));
  _descriptors.set(facets, descriptor);
  return descriptor as TSSchemaFacetsTypeDescriptor<TFacet>;
}

/**
 * Combines the descriptors of every facet of one fragment into one (see `getTSSchemaTypeDescriptor`)
 * @param descriptors Descriptors of the fragment's facets
 * @returns Descriptor of the fragment's type
 */
function _combineTSSchemaTypeDescriptors(descriptors: Array<TSSchemaTypeDescriptor>): TSSchemaTypeDescriptor {
  if (descriptors.length === 0) return { kind: 'unknown' };
  if (descriptors.length === 1) return descriptors[0];
  const values = descriptors.filter((descriptor) => !_isAbsorbedTSSchemaTypeDescriptor(descriptor));
  if (values.length === 1 && (values[0].kind === 'const' || values[0].kind === 'enum')) return values[0];
  return { kind: 'allOf', members: descriptors, implicit: true };
}

/**
 * Determines if a descriptor only describes a `type` keyword, which an `enum` or `const` alongside it absorbs: a primitive, `null` or record descriptor,
 * or an `anyOf` of those only (e.g. the branches of `type: ["string", "null"]`)
 * @param descriptor Descriptor to check
 * @returns `true` if the descriptor is absorbed by an `enum` or `const` alongside it
 */
function _isAbsorbedTSSchemaTypeDescriptor(descriptor: TSSchemaTypeDescriptor): boolean {
  if (descriptor.kind === 'primitive' || descriptor.kind === 'null' || descriptor.kind === 'record') return true;
  return descriptor.kind === 'anyOf' && descriptor.members.every((member) => member.kind === 'primitive' || member.kind === 'null' || member.kind === 'record');
}

/**
 * Describes the type of a single facet
 * @param facet Facet to describe
 * @returns Descriptor of the facet, or `undefined` for a facet describing no type
 */
function _describeFacet(facet: JSONSchemaFragmentFacet<any, any, any>): TSSchemaTypeDescriptor | undefined {
  // Model
  if (facet instanceof JSONSchemaModelFragmentFacet) {
    const properties = facet.properties as Record<string, Array<JSONSchemaFragmentFacet<any, any, any>>>;
    return {
      kind: 'model',
      properties: Object.fromEntries(Object.entries(properties).map(([name, facets]) => [name, getTSSchemaTypeDescriptor(facets) as TSSchemaTypeDescriptor])),
      required: [...facet.required],
    };
  }
  // Const
  if (facet instanceof JSONSchemaConstFragmentFacet) return { kind: 'const', value: facet.const };
  // Enum
  if (facet instanceof JSONSchemaEnumFragmentFacet) return { kind: 'enum', values: facet.enum, names: facet.names };
  // Primitive type(s)
  if (facet instanceof JSONSchemaPrimitiveTypeFragmentFacet) {
    if (!(facet.type instanceof Array)) return { kind: 'primitive', type: facet.type };
    const members = (facet.type as ReadonlyArray<JSONSchemaPrimitiveTypeName>).map((type) => ({ kind: 'primitive', type }) as const);
    return members.length === 1 ? members[0] : { kind: 'anyOf', members, implicit: true };
  }
  // Null type
  if (facet instanceof JSONSchemaNullTypeFragmentFacet) return { kind: 'null' };
  // Array type
  if (facet instanceof JSONSchemaArrayTypeFragmentFacet) {
    const items = facet.items as Array<JSONSchemaFragmentFacet<any, any, any>> | undefined;
    return { kind: 'array', items: items === undefined ? { kind: 'unknown' } : getTSSchemaTypeDescriptor(items) };
  }
  // Object type
  if (facet instanceof JSONSchemaObjectTypeFragmentFacet) return { kind: 'record', values: { kind: 'unknown' } };
  // AllOf type
  if (facet instanceof JSONSchemaAllOfTypeFragmentFacet)
    return { kind: 'allOf', members: _describeMembers(facet.allOf as Array<Array<JSONSchemaFragmentFacet<any, any, any>>>), implicit: false };
  // AnyOf type
  if (facet instanceof JSONSchemaAnyOfTypeFragmentFacet)
    return { kind: 'anyOf', members: _describeMembers(facet.anyOf as Array<Array<JSONSchemaFragmentFacet<any, any, any>>>), implicit: facet.implicit };
  // OneOf type: an enum if every member is a constant
  if (facet instanceof JSONSchemaOneOfTypeFragmentFacet) {
    const oneOf = facet.oneOf as Array<Array<JSONSchemaFragmentFacet<any, any, any>>>;
    const members = _describeMembers(oneOf);
    if (members.length === 0 || !members.every((member) => member.kind === 'const')) return { kind: 'oneOf', members };
    const values = members.map((member) => (member as TSSchemaConstTypeDescriptor).value);
    const titles = oneOf.map((facets) => (facets[0]?.fragment as { title?: unknown } | undefined)?.title);
    return { kind: 'enum', values, names: values.map((value, i) => (typeof titles[i] === 'string' ? titles[i] : getJSONSchemaValueName(value))) };
  }
  // Not type
  if (facet instanceof JSONSchemaNotTypeFragmentFacet)
    return { kind: 'not', not: getTSSchemaTypeDescriptor(facet.not as Array<JSONSchemaFragmentFacet<any, any, any>>) };
  // Reference: resolved lazily, unresolved as unknown
  if (facet instanceof JSONSchemaReferenceFragmentFacet) {
    if (facet.refName === undefined) return { kind: 'unknown' };
    return {
      kind: 'reference',
      name: facet.refName as string,
      get target(): TSSchemaTypeDescriptor {
        const ref = facet.ref as Array<JSONSchemaFragmentFacet<any, any, any>> | undefined;
        return ref === undefined ? { kind: 'unknown' } : getTSSchemaTypeDescriptor(ref);
      },
    };
  }
  // Any other facet
  return undefined;
}

/**
 * Describes each member of an `allOf`, `anyOf` or `oneOf`, in order
 * @param members Facets of each member
 * @returns Descriptor of each member
 */
function _describeMembers(members: Array<Array<JSONSchemaFragmentFacet<any, any, any>>>): Array<TSSchemaTypeDescriptor> {
  return members.map((facets) => getTSSchemaTypeDescriptor(facets));
}

// #endregion

// #region Type inference

/**
 * Infers the descriptor of a JSON schema fragment's type, as `getTSSchemaTypeDescriptor` builds it from the fragment's facets: with literal kinds,
 * values, names and property keys. The unspecified fragment infers any descriptor (`TSSchemaTypeDescriptor`).
 */
export type TSSchemaTypeDescriptorOf<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaNotCollectionFragment> =
  // Unspecified fragment: any descriptor
  JSONSchemaNotCollectionFragment extends TFragment
    ? TSSchemaTypeDescriptor
    : // Distribute over a union of fragments
      TFragment extends unknown
      ? _TSSchemaFacetsTypeDescriptor<TSchema, JSONSchemaFragmentFacetOf<TSchema, any, TFragment>>
      : never;

/**
 * Infers the descriptor of a fragment by its facets (see `getTSSchemaTypeDescriptor`): `unknown` for none, the facet's descriptor for one, and for several
 * the `enum` or `const` absorbing the `type` descriptors alongside it, or else an implicit `allOf` of all of them. Facets are counted rather than their
 * descriptors, as a single facet may infer a union of descriptors (e.g. a `$ref` in the unspecified collection).
 */
type _TSSchemaFacetsTypeDescriptor<TSchema extends JSONSchemaCollection, TFacet> =
  // No facets
  [TFacet] extends [never]
    ? TSSchemaUnknownTypeDescriptor
    : // Several facets
      true extends _IsUnion<TFacet>
      ? _TSSchemaFacetTypeDescriptor<TSchema, TFacet> extends infer D
        ? Exclude<D, _TSSchemaAbsorbedTypeDescriptor> extends infer V
          ? // A single enum or const, absorbing the type descriptors
            V extends TSSchemaConstTypeDescriptor<any> | TSSchemaEnumTypeDescriptor<any, any>
            ? true extends _IsUnion<V>
              ? TSSchemaAllOfTypeDescriptor<ReadonlyArray<D>, true>
              : V
            : // Anything else: an implicit `allOf` of all of them
              TSSchemaAllOfTypeDescriptor<ReadonlyArray<D>, true>
          : never
        : never
      : // Single facet
        _TSSchemaFacetTypeDescriptor<TSchema, TFacet>;

/**
 * Infers the descriptor of a fragment by the facets it was parsed into (the type of each element of the array), as `getTSSchemaTypeDescriptor` builds it.
 * Facets of an unspecified type infer any descriptor (`TSSchemaTypeDescriptor`).
 */
export type TSSchemaFacetsTypeDescriptor<TFacet> =
  // Unspecified facets: any descriptor
  JSONSchemaFragmentFacet<any, any, any> extends TFacet
    ? TSSchemaTypeDescriptor
    : // Facets of a collection
      [TFacet] extends [JSONSchemaFragmentFacet<infer S extends JSONSchemaCollection, any, any>]
      ? _TSSchemaFacetsTypeDescriptor<S, TFacet>
      : TSSchemaTypeDescriptor;

/**
 * Infers the descriptor of a nested fragment, of any value type (see `JSONSchemaParsedFragment`): a boolean schema, or anything else which is not a
 * schema object, has no facets and infers `unknown`
 */
type _TSSchemaNestedTypeDescriptor<TSchema extends JSONSchemaCollection, TFragment> =
  JSONSchemaParsedFragment<TFragment> extends infer F extends JSONSchemaNotCollectionFragment
    ? [F] extends [never]
      ? TSSchemaUnknownTypeDescriptor
      : TSSchemaTypeDescriptorOf<TSchema, F>
    : TSSchemaUnknownTypeDescriptor;

/**
 * Infers the descriptor of each nested fragment in an array of them, element by element for a tuple
 */
type _TSSchemaNestedTypeDescriptors<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  readonly [I in keyof TFragments]: _TSSchemaNestedTypeDescriptor<TSchema, TFragments[I]>;
};

/**
 * Descriptors which only describe a `type` keyword, absorbed by an `enum` or `const` alongside them
 */
type _TSSchemaAbsorbedTypeDescriptor =
  | TSSchemaPrimitiveTypeDescriptor<any>
  | TSSchemaNullTypeDescriptor
  | TSSchemaRecordTypeDescriptor<any>
  | TSSchemaAnyOfTypeDescriptor<ReadonlyArray<TSSchemaPrimitiveTypeDescriptor<any> | TSSchemaNullTypeDescriptor | TSSchemaRecordTypeDescriptor<any>>, any>;

/**
 * Infers the descriptor of a single facet, distributing over a union of facets. Facets are told apart by the members only their class has, testing a
 * model before the other `type: "object"` facet.
 */
type _TSSchemaFacetTypeDescriptor<TSchema extends JSONSchemaCollection, TFacet> =
  // Distribute over a union of facets
  TFacet extends JSONSchemaFragmentFacet<any, any, infer F>
    ? // Model
      TFacet extends { names: unknown; properties: unknown; required: ReadonlyArray<infer R extends string> }
      ? F extends { properties: infer P }
        ? TSSchemaModelTypeDescriptor<{ readonly [K in keyof P]-?: _TSSchemaNestedTypeDescriptor<TSchema, Exclude<P[K], undefined>> }, ReadonlyArray<R>>
        : never
      : // Const
        TFacet extends { const: infer V }
        ? TSSchemaConstTypeDescriptor<V>
        : // Enum
          TFacet extends { enum: infer E extends ReadonlyArray<unknown>; names: infer N extends ReadonlyArray<string> }
          ? TSSchemaEnumTypeDescriptor<E, Readonly<N>>
          : // Array type
            TFacet extends { items: unknown }
            ? F extends { items: infer I }
              ? TSSchemaArrayTypeDescriptor<_TSSchemaNestedTypeDescriptor<TSchema, I>>
              : TSSchemaArrayTypeDescriptor<
                  F extends { items?: infer I }
                    ? _TSSchemaNestedTypeDescriptor<TSchema, Exclude<I, undefined>> | TSSchemaUnknownTypeDescriptor
                    : TSSchemaUnknownTypeDescriptor
                >
            : // AllOf type
              TFacet extends { allOf: unknown }
              ? F extends { allOf: infer M extends ReadonlyArray<unknown> }
                ? TSSchemaAllOfTypeDescriptor<_TSSchemaNestedTypeDescriptors<TSchema, M>, false>
                : never
              : // AnyOf type: explicit if a tuple of members, possibly implicit otherwise (branches of a `type` array, a property found in several models)
                TFacet extends { anyOf: unknown; implicit: boolean }
                ? F extends { anyOf: infer M extends ReadonlyArray<unknown> }
                  ? TSSchemaAnyOfTypeDescriptor<_TSSchemaNestedTypeDescriptors<TSchema, M>, number extends M['length'] ? boolean : false>
                  : never
                : // OneOf type: an enum if every member is a constant
                  TFacet extends { oneOf: unknown }
                  ? F extends { oneOf: infer M extends ReadonlyArray<unknown> }
                    ? _TSSchemaOneOfTypeDescriptor<M, _TSSchemaNestedTypeDescriptors<TSchema, M>>
                    : never
                  : // Not type
                    TFacet extends { not: unknown }
                    ? F extends { not: infer N }
                      ? TSSchemaNotTypeDescriptor<_TSSchemaNestedTypeDescriptor<TSchema, N>>
                      : never
                    : // Reference: resolved, or unknown
                      TFacet extends { refName: infer N }
                      ? _TSSchemaReferenceTypeDescriptor<TSchema, N>
                      : // Primitive, null or object type
                        TFacet extends { type: infer T }
                        ? T extends 'null'
                          ? TSSchemaNullTypeDescriptor
                          : T extends 'object'
                            ? TSSchemaRecordTypeDescriptor<TSSchemaUnknownTypeDescriptor>
                            : _TSSchemaPrimitiveTypeDescriptor<T>
                        : never
    : never;

/**
 * Infers the descriptor of a primitive `type`: a primitive type name, or an array naming a single one, as a primitive descriptor, and an array naming
 * several as an implicit `anyOf` of them, element by element for a tuple
 */
type _TSSchemaPrimitiveTypeDescriptor<TType> =
  // Single type name
  TType extends JSONSchemaPrimitiveTypeName
    ? TSSchemaPrimitiveTypeDescriptor<TType>
    : // Array of type names
      TType extends ReadonlyArray<infer N extends JSONSchemaPrimitiveTypeName>
      ? // Several type names
        true extends _IsUnion<N>
        ? // Array of unknown length
          number extends TType['length']
          ? TSSchemaAnyOfTypeDescriptor<ReadonlyArray<N extends unknown ? TSSchemaPrimitiveTypeDescriptor<N> : never>, true>
          : // Tuple
            TSSchemaAnyOfTypeDescriptor<{ readonly [I in keyof TType]: TSSchemaPrimitiveTypeDescriptor<TType[I] & JSONSchemaPrimitiveTypeName> }, true>
        : // Single type name
          TSSchemaPrimitiveTypeDescriptor<N>
      : never;

/**
 * Infers the descriptor of a `oneOf`: an enum if every member is a constant, named by each member's `title` (or else its own name), otherwise a `oneOf`
 */
type _TSSchemaOneOfTypeDescriptor<TMembers extends ReadonlyArray<unknown>, TDescriptors> =
  // No members
  TMembers['length'] extends 0
    ? TSSchemaOneOfTypeDescriptor<[]>
    : // Constants only
      TDescriptors extends ReadonlyArray<TSSchemaConstTypeDescriptor<any>>
      ? TSSchemaEnumTypeDescriptor<
          { readonly [I in keyof TDescriptors]: TDescriptors[I] extends TSSchemaConstTypeDescriptor<infer V> ? V : never },
          {
            readonly [I in keyof TDescriptors]: TMembers[I & keyof TMembers] extends { title: infer T extends string }
              ? T
              : JSONSchemaValueName<TDescriptors[I] extends TSSchemaConstTypeDescriptor<infer V> ? V : never>;
          }
        >
      : // Any other members
        TDescriptors extends ReadonlyArray<TSSchemaTypeDescriptor>
        ? TSSchemaOneOfTypeDescriptor<TDescriptors>
        : never;

/**
 * Infers the descriptor of a reference, by the name of the referenced definition, or `unknown` for a reference which can not be resolved
 */
type _TSSchemaReferenceTypeDescriptor<TSchema extends JSONSchemaCollection, TRefName> =
  // Unspecified collection: no collection may be known to resolve it against
  JSONSchemaCollection extends TSchema
    ? TSSchemaReferenceTypeDescriptor<TRefName & string, TSSchemaTypeDescriptor> | TSSchemaUnknownTypeDescriptor
    : // Resolved reference
      TRefName extends JSONSchemaDefinitionName<TSchema>
      ? TSSchemaReferenceTypeDescriptor<TRefName & string, TSSchemaTypeDescriptorOf<TSchema, JSONSchemaCollectionParsedFragment<TSchema, TRefName>>>
      : // Unresolved reference
        TSSchemaUnknownTypeDescriptor;

/**
 * Determines if a type is a union of several types, resolving to `boolean` for a union, and `false` otherwise
 */
type _IsUnion<T, TAll = T> = T extends unknown ? ([TAll] extends [T] ? false : true) : never;

// #endregion
