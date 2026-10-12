/**
 * Type descriptors: a runtime description of the type of a JSON schema fragment, built from the facets the fragment was parsed into.
 *
 * Facets are keyword shaped (one per matching keyword, all applying at once); a type descriptor is type shaped: a tree of plain objects told apart by
 * their `kind`, describing what `TSSchemaType` infers at type level. `getTSSchemaTypeDescriptor` builds it at runtime, and `TSSchemaTypeDescriptorOf`
 * infers the same descriptor, with literal kinds, values, names, property keys and flags, at type level.
 *
 * `null` is not described as an alternative but as a flag: every descriptor's `nullable` says whether `null` is explicitly accepted where it is used, so
 * `anyOf: [{ type: "string" }, { type: "null" }]` (or `type: ["string", "null"]`) is just a nullable string.
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
 * Describes the type of a JSON schema fragment at runtime, as one of the descriptor kinds below, told apart by `kind`.
 *
 * Every kind has a `nullable` flag: whether `null` is explicitly accepted where the descriptor is used, in addition to what its kind describes. It is set
 * by a `null` member extracted from an `anyOf` (or a `type` array), a `null` value extracted from an `enum`, by members (an `anyOf` if any member is
 * nullable, an `allOf` if every member is, a `oneOf` if exactly one is), and is always `true` for the `null` kind itself. It is never derived through a
 * reference's `target` (the referenced definition may itself be nullable), and neither `unknown` (which accepts `null` anyway) nor `not` are ever
 * nullable unless extracted from an `anyOf`.
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
export interface TSSchemaUnknownTypeDescriptor<TNullable extends boolean = boolean> {
  readonly kind: 'unknown';
  readonly nullable: TNullable;
}

/**
 * Describes a single constant value (`const`). A `null` constant is described by the `null` kind instead.
 */
export interface TSSchemaConstTypeDescriptor<TValue = unknown, TNullable extends boolean = boolean> {
  readonly kind: 'const';
  readonly value: TValue;
  readonly nullable: TNullable;
}

/**
 * Describes a set of enumerated values, each with a name: an `enum` (named by its `x-enumNames`, or else each value by its own name), or a `oneOf` of
 * `const` fragments (named by each fragment's `title`, or else by its own name). A `null` value is not listed, but makes the enum `nullable`.
 */
export interface TSSchemaEnumTypeDescriptor<
  TValues extends ReadonlyArray<unknown> = ReadonlyArray<unknown>,
  TNames extends ReadonlyArray<string> = ReadonlyArray<string>,
  TNullable extends boolean = boolean,
> {
  readonly kind: 'enum';
  /**
   * The enumerated values other than `null`, in order
   */
  readonly values: TValues;
  /**
   * The name of each enumerated value, in the same order
   */
  readonly names: TNames;
  readonly nullable: TNullable;
}

/**
 * Describes a primitive type (`string`, `number`, `integer` or `boolean`). A `type` array naming several is described as an implicit `anyOf` of them.
 */
export interface TSSchemaPrimitiveTypeDescriptor<TType extends JSONSchemaPrimitiveTypeName = JSONSchemaPrimitiveTypeName, TNullable extends boolean = boolean> {
  readonly kind: 'primitive';
  readonly type: TType;
  readonly nullable: TNullable;
}

/**
 * Describes the `null` type, alone: `null` alongside other types makes them `nullable` instead
 */
export interface TSSchemaNullTypeDescriptor {
  readonly kind: 'null';
  readonly nullable: true;
}

/**
 * Describes an array, by the type of its items
 */
export interface TSSchemaArrayTypeDescriptor<TItems = TSSchemaTypeDescriptor, TNullable extends boolean = boolean> {
  readonly kind: 'array';
  /**
   * Type of every item: `unknown` if the array has no `items`, or no single schema `items`
   */
  readonly items: TItems;
  readonly nullable: TNullable;
  // TODO: Not implemented yet (as in the facet and type layers): tuples (`prefixItems`), described as an array of `unknown` items for now
}

/**
 * Describes an object with no known properties (`type: "object"` without `properties`), by the type of its values
 */
export interface TSSchemaRecordTypeDescriptor<TValues = TSSchemaTypeDescriptor, TNullable extends boolean = boolean> {
  readonly kind: 'record';
  /**
   * Type of every value: always `unknown` for now
   */
  readonly values: TValues;
  readonly nullable: TNullable;
  // TODO: Not implemented yet (as in the facet and type layers): `additionalProperties`, describing the type of the values
}

/**
 * Describes a model (`type: "object"` with `properties`), by each of its properties, and which of them are required
 */
export interface TSSchemaModelTypeDescriptor<
  TProperties = { readonly [name: string]: TSSchemaModelPropertyDescriptor },
  TRequired extends ReadonlyArray<string> = ReadonlyArray<string>,
  TNullable extends boolean = boolean,
> {
  readonly kind: 'model';
  /**
   * Each property, by property name: whether it is required, and its type
   */
  readonly properties: TProperties;
  /**
   * Names of the required properties (every other property is optional), the same as each property's `required`, for convenience
   */
  readonly required: TRequired;
  readonly nullable: TNullable;
}

/**
 * Describes a property of a model: whether the model requires it, and its type. Not a type descriptor itself: being required is up to the model, not the
 * property's type, so the property's own flags are kept apart from its type's.
 */
export interface TSSchemaModelPropertyDescriptor<TType = TSSchemaTypeDescriptor, TRequired extends boolean = boolean> {
  /**
   * Whether the property is listed in its model's `required` keyword
   */
  readonly required: TRequired;
  /**
   * Type of the property
   */
  readonly type: TType;
}

/**
 * Describes a reference (`$ref`) to a definition of the collection, by the definition's name and type. The type is described lazily, on first access to
 * `target`, as (in)directly recursive references would otherwise never finish describing.
 */
export interface TSSchemaReferenceTypeDescriptor<TName extends string = string, TTarget = TSSchemaTypeDescriptor, TNullable extends boolean = boolean> {
  readonly kind: 'reference';
  /**
   * Name of the referenced definition
   */
  readonly name: TName;
  /**
   * Type of the referenced definition: the same descriptor (by identity) for every reference to the same definition
   */
  readonly target: TTarget;
  /**
   * Whether `null` is accepted where the reference is used (e.g. `anyOf: [{ $ref }, { type: "null" }]`), regardless of the referenced definition
   */
  readonly nullable: TNullable;
}

/**
 * Describes a union of types (`anyOf`), by its members other than `null`. An implicit `anyOf` holds the branches of a `type` array naming several types,
 * or the fragments of a property found in several models. An `anyOf` left with a single member once `null` is extracted is described by that member.
 */
export interface TSSchemaAnyOfTypeDescriptor<
  TMembers extends ReadonlyArray<unknown> = ReadonlyArray<TSSchemaTypeDescriptor>,
  TImplicit extends boolean = boolean,
  TNullable extends boolean = boolean,
> {
  readonly kind: 'anyOf';
  readonly members: TMembers;
  /**
   * Whether the `anyOf` is implicit, rather than an `anyOf` keyword of the schema
   */
  readonly implicit: TImplicit;
  readonly nullable: TNullable;
}

/**
 * Describes an intersection of types (`allOf`), by its members. An implicit `allOf` holds the descriptors of several keywords of one fragment (e.g. a
 * `$ref` alongside `properties`), which all apply at once.
 */
export interface TSSchemaAllOfTypeDescriptor<
  TMembers extends ReadonlyArray<unknown> = ReadonlyArray<TSSchemaTypeDescriptor>,
  TImplicit extends boolean = boolean,
  TNullable extends boolean = boolean,
> {
  readonly kind: 'allOf';
  readonly members: TMembers;
  /**
   * Whether the `allOf` is implicit, combining several keywords of one fragment, rather than an `allOf` keyword of the schema
   */
  readonly implicit: TImplicit;
  readonly nullable: TNullable;
}

/**
 * Describes an exclusive union of types (`oneOf`), by its members. A `oneOf` of `const` fragments only is described as an enum instead. Unlike an
 * `anyOf`, a `null` member is never extracted from it (see `getTSSchemaTypeDescriptor`).
 */
export interface TSSchemaOneOfTypeDescriptor<
  TMembers extends ReadonlyArray<unknown> = ReadonlyArray<TSSchemaTypeDescriptor>,
  TNullable extends boolean = boolean,
> {
  readonly kind: 'oneOf';
  readonly members: TMembers;
  readonly nullable: TNullable;
}

/**
 * Describes the negation of a type (`not`)
 */
export interface TSSchemaNotTypeDescriptor<TNot = TSSchemaTypeDescriptor, TNullable extends boolean = boolean> {
  readonly kind: 'not';
  readonly not: TNot;
  readonly nullable: TNullable;
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
 * `type` alongside it (e.g. `type: "string", enum: [...]` is just an enum). `null` is extracted from an `anyOf`, a `type` array and an `enum` into the
 * `nullable` flag of what is left (see `TSSchemaTypeDescriptor`). The runtime counterpart of `TSSchemaTypeDescriptorOf`.
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
  if (descriptors.length === 0) return { kind: 'unknown', nullable: false };
  if (descriptors.length === 1) return descriptors[0];
  const values = descriptors.filter((descriptor) => !_isAbsorbedTSSchemaTypeDescriptor(descriptor));
  if (values.length === 1 && (values[0].kind === 'const' || values[0].kind === 'enum' || values[0].kind === 'null')) return values[0];
  return { kind: 'allOf', members: descriptors, implicit: true, nullable: descriptors.every((descriptor) => descriptor.nullable) };
}

/**
 * Determines if a descriptor only describes a `type` keyword, which an `enum` or `const` alongside it absorbs: a primitive, `null` or record descriptor,
 * or an `anyOf` of those only (e.g. the branches of `type: ["string", "integer"]`)
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
    const required = facet.required as Array<string>;
    return {
      kind: 'model',
      properties: Object.fromEntries(
        Object.entries(properties).map(([name, facets]) => [
          name,
          { required: required.includes(name), type: getTSSchemaTypeDescriptor(facets) as TSSchemaTypeDescriptor },
        ]),
      ),
      required: [...required],
      nullable: false,
    };
  }
  // Const: a `null` constant is the null type
  if (facet instanceof JSONSchemaConstFragmentFacet)
    return facet.const === null ? { kind: 'null', nullable: true } : { kind: 'const', value: facet.const, nullable: false };
  // Enum
  if (facet instanceof JSONSchemaEnumFragmentFacet) return _describeEnum(facet.enum as ReadonlyArray<unknown>, facet.names as ReadonlyArray<string>);
  // Primitive type(s)
  if (facet instanceof JSONSchemaPrimitiveTypeFragmentFacet) {
    if (!(facet.type instanceof Array)) return { kind: 'primitive', type: facet.type, nullable: false };
    const members = (facet.type as ReadonlyArray<JSONSchemaPrimitiveTypeName>).map((type) => ({ kind: 'primitive', type, nullable: false }) as const);
    return members.length === 1 ? members[0] : _describeAnyOf(members, true);
  }
  // Null type
  if (facet instanceof JSONSchemaNullTypeFragmentFacet) return { kind: 'null', nullable: true };
  // Array type
  if (facet instanceof JSONSchemaArrayTypeFragmentFacet) {
    const items = facet.items as Array<JSONSchemaFragmentFacet<any, any, any>> | undefined;
    return { kind: 'array', items: items === undefined ? { kind: 'unknown', nullable: false } : getTSSchemaTypeDescriptor(items), nullable: false };
  }
  // Object type
  if (facet instanceof JSONSchemaObjectTypeFragmentFacet) return { kind: 'record', values: { kind: 'unknown', nullable: false }, nullable: false };
  // AllOf type: nullable only if every member is
  if (facet instanceof JSONSchemaAllOfTypeFragmentFacet) {
    const members = _describeMembers(facet.allOf as Array<Array<JSONSchemaFragmentFacet<any, any, any>>>);
    return { kind: 'allOf', members, implicit: false, nullable: members.every((member) => member.nullable) };
  }
  // AnyOf type, explicit or implicit (branches of a `type` array, a property found in several models)
  if (facet instanceof JSONSchemaAnyOfTypeFragmentFacet)
    return _describeAnyOf(_describeMembers(facet.anyOf as Array<Array<JSONSchemaFragmentFacet<any, any, any>>>), facet.implicit);
  // OneOf type: an enum if every member is a constant
  if (facet instanceof JSONSchemaOneOfTypeFragmentFacet) {
    const oneOf = facet.oneOf as Array<Array<JSONSchemaFragmentFacet<any, any, any>>>;
    const members = _describeMembers(oneOf);
    if (members.length === 0 || !members.every((member) => member.kind === 'const' || member.kind === 'null'))
      // `null` is deliberately NOT extracted from a `oneOf`, unlike from an `anyOf`: `oneOf: [A, null]` only equals a nullable `A` if `A` rejects
      // `null`, and if `A` accepts it too (e.g. `A` is `{}`, or itself nullable), `null` matches both members and is rejected. Extracting it would
      // claim the opposite. Nullable only if exactly one member is.
      return { kind: 'oneOf', members, nullable: members.filter((member) => member.nullable).length === 1 };
    const values = members.map((member) => (member.kind === 'const' ? member.value : null));
    const titles = oneOf.map((facets) => (facets[0]?.fragment as { title?: unknown } | undefined)?.title);
    return _describeEnum(
      values,
      values.map((value, i) => (typeof titles[i] === 'string' ? titles[i] : getJSONSchemaValueName(value))),
    );
  }
  // Not type: never explicitly nullable, as negating a type accepts `null` only implicitly (if the negated type rejects it)
  if (facet instanceof JSONSchemaNotTypeFragmentFacet)
    return { kind: 'not', not: getTSSchemaTypeDescriptor(facet.not as Array<JSONSchemaFragmentFacet<any, any, any>>), nullable: false };
  // Reference: resolved lazily, unresolved as unknown
  if (facet instanceof JSONSchemaReferenceFragmentFacet) {
    if (facet.refName === undefined) return { kind: 'unknown', nullable: false };
    return {
      kind: 'reference',
      name: facet.refName as string,
      // A getter, not a value: resolving the target eagerly would never finish describing an (in)directly recursive schema. Anything copying a reference
      // descriptor must keep it a getter (see `_withNullable`).
      get target(): TSSchemaTypeDescriptor {
        const ref = facet.ref as Array<JSONSchemaFragmentFacet<any, any, any>> | undefined;
        return ref === undefined ? { kind: 'unknown', nullable: false } : getTSSchemaTypeDescriptor(ref);
      },
      // Never derived from the target: that would resolve it, defeating the laziness above, and loop on a definition referencing itself through an
      // `anyOf`. A reference is nullable only where `null` is extracted next to it.
      nullable: false,
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

/**
 * Describes an `anyOf`, extracting its `null` members into the `nullable` flag of the rest: no member left is the null type, a single member left is that
 * member made nullable, and several are a nullable `anyOf` of them. With no `null` member, the `anyOf` is nullable if any of its members is.
 * @param members Descriptors of the members
 * @param implicit Whether the `anyOf` is implicit
 * @returns Descriptor of the `anyOf`
 */
function _describeAnyOf(members: Array<TSSchemaTypeDescriptor>, implicit: boolean): TSSchemaTypeDescriptor {
  const rest = members.filter((member) => member.kind !== 'null');
  if (rest.length === members.length) return { kind: 'anyOf', members, implicit, nullable: members.some((member) => member.nullable) };
  if (rest.length === 0) return { kind: 'null', nullable: true };
  if (rest.length === 1) return _withNullable(rest[0], true);
  return { kind: 'anyOf', members: rest, implicit, nullable: true };
}

/**
 * Describes enumerated values and their names, extracting `null` values into the `nullable` flag: only `null` values are the null type
 * @param values The enumerated values
 * @param names The name of each value, in the same order
 * @returns Descriptor of the enum
 */
function _describeEnum(values: ReadonlyArray<unknown>, names: ReadonlyArray<string>): TSSchemaTypeDescriptor {
  const kept = values.map((_value, i) => i).filter((i) => values[i] !== null);
  if (kept.length === values.length) return { kind: 'enum', values, names, nullable: false };
  if (kept.length === 0) return { kind: 'null', nullable: true };
  return { kind: 'enum', values: kept.map((i) => values[i]), names: kept.map((i) => names[i]), nullable: true };
}

/**
 * Gets a descriptor with its `nullable` flag set, as a copy: the descriptor itself is never modified, as descriptors are cached and shared (a
 * definition's descriptor is the `target` of every reference to it, see `getTSSchemaTypeDescriptor`), so setting the flag in place would make it
 * nullable everywhere it is used.
 * @param descriptor Descriptor to copy
 * @param nullable Value of the copy's `nullable` flag
 * @returns The descriptor itself if its flag already has the value, a copy with the flag set otherwise
 */
function _withNullable(descriptor: TSSchemaTypeDescriptor, nullable: boolean): TSSchemaTypeDescriptor {
  if (descriptor.nullable === nullable) return descriptor;
  // Copied by property descriptors, not by spreading (`{ ...descriptor }`): spreading reads a reference's lazy `target` getter, resolving the target
  // eagerly, which never finishes describing a recursive schema. Copying the getter keeps it lazy.
  return Object.defineProperties(
    {},
    { ...Object.getOwnPropertyDescriptors(descriptor), nullable: { value: nullable, enumerable: true } },
  ) as TSSchemaTypeDescriptor;
}

// #endregion

// #region Type inference

/**
 * Infers the descriptor of a JSON schema fragment's type, as `getTSSchemaTypeDescriptor` builds it from the fragment's facets: with literal kinds,
 * values, names, property keys and flags. The unspecified fragment infers any descriptor (`TSSchemaTypeDescriptor`).
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
 * Infers the descriptor of a fragment by its facets (see `getTSSchemaTypeDescriptor`): `unknown` for none, the facet's descriptor for one, and for several
 * the `enum`, `const` or `null` absorbing the `type` descriptors alongside it, or else an implicit `allOf` of all of them. Facets are counted rather than
 * their descriptors, as a single facet may infer a union of descriptors (e.g. a `$ref` in the unspecified collection).
 */
type _TSSchemaFacetsTypeDescriptor<TSchema extends JSONSchemaCollection, TFacet> =
  // No facets
  [TFacet] extends [never]
    ? _TSSchemaUnknownTypeDescriptor
    : // Several facets
      true extends _IsUnion<TFacet>
      ? _TSSchemaFacetTypeDescriptor<TSchema, TFacet> extends infer D
        ? Exclude<D, _TSSchemaAbsorbedTypeDescriptor> extends infer V
          ? // A single enum, const or null, absorbing the type descriptors
            V extends TSSchemaConstTypeDescriptor<any, any> | TSSchemaEnumTypeDescriptor<any, any, any> | TSSchemaNullTypeDescriptor
            ? true extends _IsUnion<V>
              ? TSSchemaAllOfTypeDescriptor<ReadonlyArray<D>, true, _EveryNullable<D>>
              : V
            : // Anything else: an implicit `allOf` of all of them
              TSSchemaAllOfTypeDescriptor<ReadonlyArray<D>, true, _EveryNullable<D>>
          : never
        : never
      : // Single facet
        _TSSchemaFacetTypeDescriptor<TSchema, TFacet>;

/**
 * Descriptor of `unknown`, as described from a schema (never nullable unless extracted from an `anyOf`)
 */
type _TSSchemaUnknownTypeDescriptor = TSSchemaUnknownTypeDescriptor<false>;

/**
 * Descriptors which only describe a `type` keyword, absorbed by an `enum` or `const` alongside them
 */
type _TSSchemaAbsorbedTypeDescriptor =
  | TSSchemaPrimitiveTypeDescriptor<any, any>
  | TSSchemaNullTypeDescriptor
  | TSSchemaRecordTypeDescriptor<any, any>
  | TSSchemaAnyOfTypeDescriptor<
      ReadonlyArray<TSSchemaPrimitiveTypeDescriptor<any, any> | TSSchemaNullTypeDescriptor | TSSchemaRecordTypeDescriptor<any, any>>,
      any,
      any
    >;

/**
 * Infers the descriptor of a nested fragment, of any value type (see `JSONSchemaParsedFragment`): a boolean schema, or anything else which is not a
 * schema object, has no facets and infers `unknown`
 */
type _TSSchemaNestedTypeDescriptor<TSchema extends JSONSchemaCollection, TFragment> =
  JSONSchemaParsedFragment<TFragment> extends infer F extends JSONSchemaNotCollectionFragment
    ? [F] extends [never]
      ? _TSSchemaUnknownTypeDescriptor
      : TSSchemaTypeDescriptorOf<TSchema, F>
    : _TSSchemaUnknownTypeDescriptor;

/**
 * Infers the descriptor of each nested fragment in an array of them, element by element for a tuple
 */
type _TSSchemaNestedTypeDescriptors<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  readonly [I in keyof TFragments]: _TSSchemaNestedTypeDescriptor<TSchema, TFragments[I]>;
};

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
        ? TSSchemaModelTypeDescriptor<
            {
              readonly [K in keyof P]-?: TSSchemaModelPropertyDescriptor<
                _TSSchemaNestedTypeDescriptor<TSchema, Exclude<P[K], undefined>>,
                K extends R ? true : false
              >;
            },
            ReadonlyArray<R>,
            false
          >
        : never
      : // Const: a `null` constant is the null type
        TFacet extends { const: infer V }
        ? _TSSchemaConstTypeDescriptor<V>
        : // Enum
          TFacet extends { enum: infer E extends ReadonlyArray<unknown>; names: infer N extends ReadonlyArray<string> }
          ? _TSSchemaEnumTypeDescriptor<E, N>
          : // Array type
            TFacet extends { items: unknown }
            ? F extends { items: infer I }
              ? TSSchemaArrayTypeDescriptor<_TSSchemaNestedTypeDescriptor<TSchema, I>, false>
              : TSSchemaArrayTypeDescriptor<
                  F extends { items?: infer I }
                    ? _TSSchemaNestedTypeDescriptor<TSchema, Exclude<I, undefined>> | _TSSchemaUnknownTypeDescriptor
                    : _TSSchemaUnknownTypeDescriptor,
                  false
                >
            : // AllOf type: nullable only if every member is
              TFacet extends { allOf: unknown }
              ? F extends { allOf: infer M extends ReadonlyArray<unknown> }
                ? _TSSchemaNestedTypeDescriptors<TSchema, M> extends infer D extends ReadonlyArray<unknown>
                  ? TSSchemaAllOfTypeDescriptor<D, false, _EveryNullable<D[number]>>
                  : never
                : never
              : // AnyOf type: explicit if a tuple of members, possibly implicit otherwise (branches of a `type` array, a property found in several models)
                TFacet extends { anyOf: unknown; implicit: boolean }
                ? F extends { anyOf: infer M extends ReadonlyArray<unknown> }
                  ? _TSSchemaAnyOfTypeDescriptor<_TSSchemaNestedTypeDescriptors<TSchema, M>, number extends M['length'] ? boolean : false>
                  : never
                : // OneOf type: an enum if every member is a constant
                  TFacet extends { oneOf: unknown }
                  ? F extends { oneOf: infer M extends ReadonlyArray<unknown> }
                    ? _TSSchemaOneOfTypeDescriptor<M, _TSSchemaNestedTypeDescriptors<TSchema, M>>
                    : never
                  : // Not type: never explicitly nullable
                    TFacet extends { not: unknown }
                    ? F extends { not: infer N }
                      ? TSSchemaNotTypeDescriptor<_TSSchemaNestedTypeDescriptor<TSchema, N>, false>
                      : never
                    : // Reference: resolved, or unknown
                      TFacet extends { refName: infer N }
                      ? _TSSchemaReferenceTypeDescriptor<TSchema, N>
                      : // Primitive, null or object type
                        TFacet extends { type: infer T }
                        ? T extends 'null'
                          ? TSSchemaNullTypeDescriptor
                          : T extends 'object'
                            ? TSSchemaRecordTypeDescriptor<_TSSchemaUnknownTypeDescriptor, false>
                            : _TSSchemaPrimitiveTypeDescriptor<T>
                        : never
    : never;

/**
 * Infers the descriptor of a constant: the null type for `null`, either for a value which may be `null`, and a constant otherwise
 */
type _TSSchemaConstTypeDescriptor<TValue> =
  // Null constant
  [TValue] extends [null]
    ? TSSchemaNullTypeDescriptor
    : // Constant which may be null
      null extends TValue
      ? TSSchemaConstTypeDescriptor<TValue, false> | TSSchemaNullTypeDescriptor
      : // Any other constant
        TSSchemaConstTypeDescriptor<TValue, false>;

/**
 * Infers the descriptor of enumerated values and their names, extracting `null` values into the `nullable` flag (see `_describeEnum`): element by element
 * for a tuple of values, only `null` values being the null type
 */
type _TSSchemaEnumTypeDescriptor<TValues extends ReadonlyArray<unknown>, TNames extends ReadonlyArray<string>> =
  // Array of unknown length
  number extends TValues['length']
    ? TSSchemaEnumTypeDescriptor<ReadonlyArray<Exclude<TValues[number], null>>, Readonly<TNames>, null extends TValues[number] ? boolean : false>
    : // Tuple
      _TSSchemaEnumWithoutNull<TValues, TNames> extends [
          infer V extends ReadonlyArray<unknown>,
          infer N extends ReadonlyArray<string>,
          infer TNull extends boolean,
        ]
      ? TNull extends true
        ? V['length'] extends 0
          ? TSSchemaNullTypeDescriptor
          : TSSchemaEnumTypeDescriptor<Readonly<V>, Readonly<N>, true>
        : TSSchemaEnumTypeDescriptor<TValues, Readonly<TNames>, false>
      : never;

/**
 * Splits a tuple of enumerated values and their names into the values other than `null`, their names, and whether a `null` value was left out
 */
type _TSSchemaEnumWithoutNull<
  TValues,
  TNames,
  TKeptValues extends Array<unknown> = [],
  TKeptNames extends Array<string> = [],
  TNull extends boolean = false,
> = TValues extends readonly [infer V, ...infer VR]
  ? [V] extends [null]
    ? _TSSchemaEnumWithoutNull<VR, _Tail<TNames>, TKeptValues, TKeptNames, true>
    : _TSSchemaEnumWithoutNull<VR, _Tail<TNames>, [...TKeptValues, V], [...TKeptNames, _Head<TNames>], TNull>
  : [TKeptValues, TKeptNames, TNull];

/**
 * Gets the first name of a tuple of names, or any name of an array of unknown length
 */
type _Head<TNames> = TNames extends readonly [infer H extends string, ...Array<unknown>]
  ? H
  : TNames extends ReadonlyArray<infer E extends string>
    ? E
    : string;

/**
 * Gets all but the first name of a tuple of names, or an array of unknown length as is
 */
type _Tail<TNames> = TNames extends readonly [unknown, ...infer R] ? R : TNames;

/**
 * Infers the descriptor of an `anyOf`, extracting its `null` members into the `nullable` flag of the rest (see `_describeAnyOf`): element by element for
 * a tuple of members, by member type for an array of unknown length (assuming each member type is a single member, as the router's branches are)
 */
type _TSSchemaAnyOfTypeDescriptor<TMembers extends ReadonlyArray<unknown>, TImplicit extends boolean> =
  // Unspecified members: any descriptor
  TSSchemaTypeDescriptor extends TMembers[number]
    ? TSSchemaTypeDescriptor
    : // Array of unknown length
      number extends TMembers['length']
      ? TSSchemaNullTypeDescriptor extends TMembers[number]
        ? Exclude<TMembers[number], TSSchemaNullTypeDescriptor> extends infer R
          ? // Only null
            [R] extends [never]
            ? TSSchemaNullTypeDescriptor
            : // Several other members
              true extends _IsUnion<R>
              ? TSSchemaAnyOfTypeDescriptor<ReadonlyArray<R>, TImplicit, true>
              : // A single other member
                _WithNullable<R, true>
          : never
        : // No null member
          TSSchemaAnyOfTypeDescriptor<TMembers, TImplicit, _SomeNullable<TMembers[number]>>
      : // Tuple
        _WithoutNullDescriptors<TMembers> extends infer R extends Array<unknown>
        ? // No null member
          R['length'] extends TMembers['length']
          ? TSSchemaAnyOfTypeDescriptor<TMembers, TImplicit, _SomeNullable<TMembers[number]>>
          : // Only null
            R['length'] extends 0
            ? TSSchemaNullTypeDescriptor
            : // A single other member
              R['length'] extends 1
              ? _WithNullable<R[0], true>
              : // Several other members
                TSSchemaAnyOfTypeDescriptor<Readonly<R>, TImplicit, true>
        : never;

/**
 * Leaves the null type out of a tuple of descriptors
 */
type _WithoutNullDescriptors<TMembers, TKept extends Array<unknown> = []> = TMembers extends readonly [infer M, ...infer R]
  ? _WithoutNullDescriptors<R, [M] extends [TSSchemaNullTypeDescriptor] ? TKept : [...TKept, M]>
  : TKept;

/**
 * Infers the descriptor of a `oneOf`: an enum if every member is a constant (or `null`), named by each member's `title` (or else its own name), otherwise
 * a `oneOf`, nullable only if exactly one member is. `null` members are never extracted from a `oneOf` (see `_describeFacet`).
 */
type _TSSchemaOneOfTypeDescriptor<TMembers extends ReadonlyArray<unknown>, TDescriptors> =
  // No members
  TMembers['length'] extends 0
    ? TSSchemaOneOfTypeDescriptor<readonly [], false>
    : // Constants only
      TDescriptors extends ReadonlyArray<TSSchemaConstTypeDescriptor<any, any> | TSSchemaNullTypeDescriptor>
      ? _TSSchemaEnumTypeDescriptor<
          { readonly [I in keyof TDescriptors]: TDescriptors[I] extends TSSchemaConstTypeDescriptor<infer V, any> ? V : null },
          {
            readonly [I in keyof TDescriptors]: TMembers[I & keyof TMembers] extends { title: infer T extends string }
              ? T
              : JSONSchemaValueName<TDescriptors[I] extends TSSchemaConstTypeDescriptor<infer V, any> ? V : null>;
          }
        >
      : // Any other members
        TDescriptors extends ReadonlyArray<unknown>
        ? TSSchemaOneOfTypeDescriptor<TDescriptors, _OneNullable<TDescriptors>>
        : never;

/**
 * Infers the descriptor of a primitive `type`: a primitive type name, or an array naming a single one, as a primitive descriptor, and an array naming
 * several as an implicit `anyOf` of them, element by element for a tuple
 */
type _TSSchemaPrimitiveTypeDescriptor<TType> =
  // Single type name
  TType extends JSONSchemaPrimitiveTypeName
    ? TSSchemaPrimitiveTypeDescriptor<TType, false>
    : // Array of type names
      TType extends ReadonlyArray<infer N extends JSONSchemaPrimitiveTypeName>
      ? // Several type names
        true extends _IsUnion<N>
        ? // Array of unknown length
          number extends TType['length']
          ? TSSchemaAnyOfTypeDescriptor<ReadonlyArray<N extends unknown ? TSSchemaPrimitiveTypeDescriptor<N, false> : never>, true, false>
          : // Tuple
            TSSchemaAnyOfTypeDescriptor<
              { readonly [I in keyof TType]: TSSchemaPrimitiveTypeDescriptor<TType[I] & JSONSchemaPrimitiveTypeName, false> },
              true,
              false
            >
        : // Single type name
          TSSchemaPrimitiveTypeDescriptor<N, false>
      : never;

/**
 * Infers the descriptor of a reference, by the name of the referenced definition, or `unknown` for a reference which can not be resolved
 */
type _TSSchemaReferenceTypeDescriptor<TSchema extends JSONSchemaCollection, TRefName> =
  // Unspecified collection: no collection may be known to resolve it against
  JSONSchemaCollection extends TSchema
    ? TSSchemaReferenceTypeDescriptor<TRefName & string, TSSchemaTypeDescriptor, false> | _TSSchemaUnknownTypeDescriptor
    : // Resolved reference
      TRefName extends JSONSchemaDefinitionName<TSchema>
      ? TSSchemaReferenceTypeDescriptor<TRefName & string, TSSchemaTypeDescriptorOf<TSchema, JSONSchemaCollectionParsedFragment<TSchema, TRefName>>, false>
      : // Unresolved reference
        _TSSchemaUnknownTypeDescriptor;

/**
 * Infers a descriptor with its `nullable` flag set (see `_withNullable`), distributing over a union of descriptors
 */
type _WithNullable<TDescriptor, TNullable extends boolean> =
  // Unknown
  TDescriptor extends TSSchemaUnknownTypeDescriptor<any>
    ? TSSchemaUnknownTypeDescriptor<TNullable>
    : // Const
      TDescriptor extends TSSchemaConstTypeDescriptor<infer V, any>
      ? TSSchemaConstTypeDescriptor<V, TNullable>
      : // Enum
        TDescriptor extends TSSchemaEnumTypeDescriptor<infer V, infer N, any>
        ? TSSchemaEnumTypeDescriptor<V, N, TNullable>
        : // Primitive type
          TDescriptor extends TSSchemaPrimitiveTypeDescriptor<infer T, any>
          ? TSSchemaPrimitiveTypeDescriptor<T, TNullable>
          : // Null type: always nullable
            TDescriptor extends TSSchemaNullTypeDescriptor
            ? TSSchemaNullTypeDescriptor
            : // Array type
              TDescriptor extends TSSchemaArrayTypeDescriptor<infer I, any>
              ? TSSchemaArrayTypeDescriptor<I, TNullable>
              : // Record type
                TDescriptor extends TSSchemaRecordTypeDescriptor<infer V, any>
                ? TSSchemaRecordTypeDescriptor<V, TNullable>
                : // Model
                  TDescriptor extends TSSchemaModelTypeDescriptor<infer P, infer R, any>
                  ? TSSchemaModelTypeDescriptor<P, R, TNullable>
                  : // Reference
                    TDescriptor extends TSSchemaReferenceTypeDescriptor<infer N, infer T, any>
                    ? TSSchemaReferenceTypeDescriptor<N, T, TNullable>
                    : // AnyOf type
                      TDescriptor extends TSSchemaAnyOfTypeDescriptor<infer M, infer I, any>
                      ? TSSchemaAnyOfTypeDescriptor<M, I, TNullable>
                      : // AllOf type
                        TDescriptor extends TSSchemaAllOfTypeDescriptor<infer M, infer I, any>
                        ? TSSchemaAllOfTypeDescriptor<M, I, TNullable>
                        : // OneOf type
                          TDescriptor extends TSSchemaOneOfTypeDescriptor<infer M, any>
                          ? TSSchemaOneOfTypeDescriptor<M, TNullable>
                          : // Not type
                            TDescriptor extends TSSchemaNotTypeDescriptor<infer N, any>
                            ? TSSchemaNotTypeDescriptor<N, TNullable>
                            : never;

/**
 * Classifies the `nullable` flag of each of a union of descriptors, as `'true'`, `'false'` or `'boolean'` (strings, so that a union of a `true` and a
 * `false` flag is not mistaken for a single `boolean` one)
 */
type _NullableFlag<TDescriptor> = TDescriptor extends { readonly nullable: infer N }
  ? [N] extends [true]
    ? 'true'
    : [N] extends [false]
      ? 'false'
      : 'boolean'
  : 'boolean';

/**
 * Infers whether any of a union of descriptors is nullable
 */
type _SomeNullable<TDescriptor> = 'true' extends _NullableFlag<TDescriptor> ? true : 'boolean' extends _NullableFlag<TDescriptor> ? boolean : false;

/**
 * Infers whether every one of a union of descriptors is nullable
 */
type _EveryNullable<TDescriptor> = 'false' extends _NullableFlag<TDescriptor> ? false : 'boolean' extends _NullableFlag<TDescriptor> ? boolean : true;

/**
 * Infers whether exactly one of a tuple of descriptors is nullable, or `boolean` if that can not be known (an array of unknown length, or a member whose
 * flag is not known)
 */
type _OneNullable<TDescriptors extends ReadonlyArray<unknown>> =
  // Array of unknown length
  number extends TDescriptors['length']
    ? [_NullableFlag<TDescriptors[number]>] extends ['false']
      ? false
      : boolean
    : // Member whose flag is not known
      'boolean' extends _NullableFlag<TDescriptors[number]>
      ? boolean
      : // Tuple
        _NullableCount<TDescriptors> extends 1
        ? true
        : false;

/**
 * Counts the nullable descriptors of a tuple of descriptors
 */
type _NullableCount<TDescriptors, TCount extends Array<unknown> = []> = TDescriptors extends readonly [infer D, ...infer R]
  ? _NullableCount<R, _NullableFlag<D> extends 'true' ? [...TCount, D] : TCount>
  : TCount['length'];

/**
 * Determines if a type is a union of several types, resolving to `boolean` for a union, and `false` otherwise
 */
type _IsUnion<T, TAll = T> = T extends unknown ? ([TAll] extends [T] ? false : true) : never;

// #endregion
