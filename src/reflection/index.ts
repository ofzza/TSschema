import {
  JSONSchema7,
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
  JSONSchemaFragmentName,
  JSONSchemaFragmentPropertyName,
  JSONSchemaFragmentType,
  JSONSchemaFragmentTypeBranch,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
  JSONSchemaNotTypeFragment,
  JSONSchemaNullTypeFragment,
  JSONSchemaObjectTypeFragment,
  JSONSchemaOneOfTypeFragment,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaPrimitiveTypeName,
  JSONSchemaReferenceFragment,
} from '../schema/JSONSchema/index.js';

export class JSONSchemaCollectionFragmentReflect<TSchema extends JSONSchemaCollection> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaCollection {
    return _isJSONSchemaObject(fragment?.['$defs']);
  }

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

  protected _fragmentNames: Array<JSONSchemaFragmentName<TSchema>>;
  protected _fragmentReflections: _JSONSchemaCollectionFragmentsReflect<TSchema>;

  public get names(): Array<JSONSchemaFragmentName<TSchema>> {
    return [...this._fragmentNames];
  }

  public fragment<TName extends JSONSchemaFragmentName<TSchema>>(
    name: TName,
  ): Array<JSONSchemaFragmentReflection<TSchema, TName, _JSONSchemaCollectionFragment<TSchema, TName>>> {
    return this._fragmentReflections[name];
  }
}

/**
 * Gets the root fragment of a JSON schema collection, i.e. the collection with its `$defs` left out
 */
type _JSONSchemaCollectionRootFragment<TSchema extends JSONSchemaCollection> =
  Omit<TSchema, '$defs'> extends infer F extends JSONSchemaNotCollectionFragment ? F : never;

/**
 * Gets the fragment(s) addressed by name from a JSON schema collection, as reflected (see `_JSONSchemaReflectedFragment`)
 */
type _JSONSchemaCollectionFragment<TSchema extends JSONSchemaCollection, TName extends JSONSchemaFragmentName<TSchema>> = _JSONSchemaReflectedFragment<
  TSchema['$defs'][TName]
>;

/**
 * Infers the reflections of each of a JSON schema collection's fragments, by fragment name
 */
type _JSONSchemaCollectionFragmentsReflect<TSchema extends JSONSchemaCollection> = {
  [TName in JSONSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentReflection<TSchema, TName, _JSONSchemaCollectionFragment<TSchema, TName>>>;
};

/**
 * Infers the reflection types matching a JSON schema fragment, as a union of reflection types.
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
        : // Type array split into several branches: the implicit `anyOf`, besides the reflections of the type independent keywords
          JSONSchemaFragmentTypeBranch<TFragment> extends infer B extends JSONSchemaNotCollectionFragment
          ? true extends _IsUnion<B>
            ? _JSONSchemaFragmentReflection<TSchema, TName, TFragment> | _JSONSchemaImplicitAnyOfTypeFragmentReflect<TSchema, TName, B>
            : _JSONSchemaFragmentReflection<TSchema, TName, B>
          : never
    : never;

/**
 * Infers the reflection types matching a single (non-union, unsplit) JSON schema fragment, as a union of reflection types
 */
type _JSONSchemaFragmentReflection<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
> =
  | (TFragment extends infer F extends JSONSchemaModelFragment ? JSONSchemaModelFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaConstFragment ? JSONSchemaConstFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaEnumFragment ? JSONSchemaEnumFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaPrimitiveTypeFragment ? JSONSchemaPrimitiveTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaNullTypeFragment ? JSONSchemaNullTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaArrayTypeFragment ? JSONSchemaArrayTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaObjectTypeFragment ? JSONSchemaObjectTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaAllOfTypeFragment ? JSONSchemaAllOfTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaAnyOfTypeFragment ? JSONSchemaAnyOfTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaOneOfTypeFragment ? JSONSchemaOneOfTypeFragmentReflect<TSchema, TName, F> : never)
  | (TFragment extends infer F extends JSONSchemaNotTypeFragment ? JSONSchemaNotTypeFragmentReflect<TSchema, TName, F> : never)
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
 * Infers the implicit any-of-types reflection of a type array split into several branches, holding a branch per group of type names, each with the type
 * independent keywords left out
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
 * Determines if a type is a union of several types
 */
type _IsUnion<T, TAll = T> = T extends unknown ? ([TAll] extends [T] ? false : true) : never;

/**
 * Analyses a fragment and returns instances of all fragment reflection types matching it
 * @param schema Reflection of the JSON schema collection the fragment belongs to
 * @param name Name of the fragment within the collection, or `undefined` for a nested fragment
 * @param fragment JSON fragment to reflect on
 * @returns Reflections of all fragment types the fragment matches, or an empty array if it matches none
 *
 * A `type` array naming `object`, `array` and / or `null` is split into branches (see `getJSONSchemaFragmentTypeBranches`). A single branch is reflected
 * as if `type` named its group directly. Several branches are alternatives (a value is of one of them), so they are reflected as an implicit `anyOf`: the
 * type independent keywords (`const`, `enum`, `$ref`, `allOf`, `anyOf`, `oneOf`, `not`) are reflected on the fragment itself, and one more (implicit)
 * any-of-types reflection holds the branches, each with the type independent keywords left out.
 */
export function createJSONSchemaFragmentReflections<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
>(schema: JSONSchemaCollectionFragmentReflect<TSchema>, name: TName, fragment: TFragment): Array<JSONSchemaFragmentReflection<TSchema, TName, TFragment>> {
  // Reflect a single type array branch as is
  const branches = getJSONSchemaFragmentTypeBranches(fragment);
  if (branches.length === 1 && branches[0] !== fragment)
    return createJSONSchemaFragmentReflections(schema, name, branches[0] as JSONSchemaNotCollectionFragment) as Array<
      JSONSchemaFragmentReflection<TSchema, TName, TFragment>
    >;

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
 * Keywords which constrain a value regardless of its type, and are reflected by their own fragment reflection types
 */
const _JSONSchemaTypeIndependentKeywords = ['const', 'enum', '$ref', 'allOf', 'anyOf', 'oneOf', 'not'] as const;

/**
 * Splits a fragment whose `type` is an array naming `object`, `array` and / or `null` into branches, one per group of type names (`object`, `array`,
 * `null`, and all primitive types together as an array of type names). Each branch is the fragment with `type` narrowed to the group, keeping every other
 * keyword. Any other fragment is its own single branch.
 * @param fragment JSON fragment to split
 * @returns Branches of the fragment, or an array holding just the fragment itself if its `type` needs no splitting
 */
export function getJSONSchemaFragmentTypeBranches<TFragment extends JSONSchemaNotCollectionFragment>(
  fragment: TFragment,
): Array<JSONSchemaFragmentTypeBranch<TFragment>> {
  const type = fragment?.type;
  if (!(type instanceof Array) || !(type.includes('object') || type.includes('array') || type.includes('null')))
    return [fragment as JSONSchemaFragmentTypeBranch<TFragment>];
  const primitives = type.filter((name) => _JSONSchemaPrimitiveTypeNames.includes(name as JSONSchemaPrimitiveTypeName));
  const groups = [
    ...(type.includes('object') ? ['object' as const] : []),
    ...(type.includes('array') ? ['array' as const] : []),
    ...(type.includes('null') ? ['null' as const] : []),
    ...(primitives.length ? [primitives] : []),
  ];
  return groups.map((group) => ({ ...fragment, type: group }) as JSONSchemaFragmentTypeBranch<TFragment>);
}

/**
 * Reflects a fragment nested in, and owned by, another fragment (e.g. a model property or an `allOf` member). Nested fragments have no name.
 * @param schema Reflection of the JSON schema collection the parent fragment belongs to
 * @param fragment Nested JSON fragment to reflect on
 * @returns Reflections of all fragment types the nested fragment matches, or an empty array if it is not a fragment object (e.g. a boolean schema)
 */
export function createJSONSchemaNestedFragmentReflections<TSchema extends JSONSchemaCollection, TFragment>(
  schema: JSONSchemaCollectionFragmentReflect<TSchema>,
  fragment: TFragment,
): _JSONSchemaNestedFragmentReflect<TSchema, TFragment> {
  return (
    _isJSONSchemaObject(fragment) ? createJSONSchemaFragmentReflections(schema, undefined, fragment as JSONSchemaNotCollectionFragment) : []
  ) as _JSONSchemaNestedFragmentReflect<TSchema, TFragment>;
}

/**
 * Determines if a value is a (non-array) object, i.e. a JSON schema object rather than a boolean schema or an array
 * @param value Value to check
 * @returns `true` if the value is a non-array object
 */
function _isJSONSchemaObject(value: unknown): value is object {
  return value instanceof Object && !(value instanceof Array);
}

/**
 * Infers the reflections of a fragment nested in another fragment. A nested object of unknown shape infers the reflections of an unspecified fragment,
 * anything else (a boolean schema, an array) infers no reflections.
 */
type _JSONSchemaNestedFragmentReflect<TSchema extends JSONSchemaCollection, TFragment> = Array<
  JSONSchemaFragmentReflection<TSchema, undefined, _JSONSchemaReflectedFragment<TFragment>>
>;

/**
 * Gets the fragment type a value is reflected as: a (non-collection) fragment as is, an object of any other shape as an unspecified fragment, and anything
 * else (a boolean schema, an array) as `never`, i.e. with no reflections
 */
type _JSONSchemaReflectedFragment<T> =
  // Fragment
  T extends JSONSchemaNotCollectionFragment
    ? T
    : // Not a fragment object
      T extends ReadonlyArray<unknown>
      ? never
      : // Object of unknown shape
        T extends object
        ? JSONSchemaNotCollectionFragment
        : never;

/**
 * Infers the reflections of each fragment in an array of nested fragments, element by element for a tuple
 */
type _JSONSchemaNestedFragmentsReflect<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  -readonly [I in keyof TFragments]: _JSONSchemaNestedFragmentReflect<TSchema, TFragments[I]>;
};

export abstract class JSONSchemaFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
> {
  /**
   * This accessor should never be accessed in runtime, it is only meant to be used for type inference convenience: `typeof reflect.Type`
   */
  public get Type(): JSONSchemaFragmentType<TFragment, TSchema> {
    throw new Error('This accessor should never be accessed, it is only meant to be used for type inference convenience: `typeof reflect.Type`');
  }

  /**
   * Name of the fragment within its collection, or `undefined` for a nested (or root) fragment
   */
  public get name(): TName {
    return this._fragmentName;
  }

  /**
   * The reflected JSON fragment
   */
  public get fragment(): TFragment {
    return this._fragment;
  }

  public constructor(
    protected _schema: JSONSchemaCollectionFragmentReflect<TSchema>,
    protected _fragmentName: TName,
    protected _fragment: TFragment,
  ) {}

  // TODO: Not implemented yet (as in the type layer): `readOnly`, `writeOnly`
}

export class JSONSchemaModelFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaModelFragment {
    return fragment?.type === 'object' && _isJSONSchemaObject(fragment?.['properties']);
  }

  public readonly type: TFragment['type'];

  /**
   * Names of all the model's properties
   */
  public readonly names: Array<JSONSchemaFragmentPropertyName<TFragment>>;

  /**
   * Reflections of each property's fragment, by property name
   */
  public readonly properties: _JSONSchemaModelFragmentPropertiesReflect<TSchema, TFragment>;

  /**
   * Names of the model's required properties, as listed by its `required` keyword (names of properties the model does not define are left out). Note
   * that the type layer does not support `required` yet, and still infers every property of a model as required.
   */
  public readonly required: Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
    this.names = Object.keys(_fragment['properties']) as Array<JSONSchemaFragmentPropertyName<TFragment>>;
    this.properties = Object.fromEntries(
      Object.entries(_fragment['properties']).map(([name, property]) => [name, createJSONSchemaNestedFragmentReflections(_schema, property)]),
    ) as _JSONSchemaModelFragmentPropertiesReflect<TSchema, TFragment>;
    const required = _fragment['required'];
    this.required = (
      required instanceof Array ? required.filter((name) => typeof name === 'string' && (this.names as Array<string>).includes(name)) : []
    ) as Array<_JSONSchemaModelFragmentRequiredName<TFragment>>;
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`
}

/**
 * Infers the names of a model fragment's required properties, as listed by its `required` keyword and defined by the model. A model with no `required`
 * infers `never`.
 */
type _JSONSchemaModelFragmentRequiredName<TFragment extends JSONSchemaModelFragment> = TFragment extends { required?: infer R }
  ? Exclude<R, undefined> extends infer Q extends ReadonlyArray<unknown>
    ? Extract<Q[number], JSONSchemaFragmentPropertyName<TFragment>>
    : never
  : never;

/**
 * Infers the reflections of each of a model fragment's properties, by property name. Every property is required and mutable, regardless of the modifiers
 * the schema's own `properties` object was declared with.
 */
type _JSONSchemaModelFragmentPropertiesReflect<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaModelFragment> = {
  -readonly [K in keyof TFragment['properties']]-?: _JSONSchemaNestedFragmentReflect<TSchema, Exclude<TFragment['properties'][K], undefined>>;
};

export class JSONSchemaConstFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaConstFragment = JSONSchemaConstFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaConstFragment {
    return _isJSONSchemaObject(fragment) && 'const' in fragment;
  }

  public readonly const: TFragment['const'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.const = _fragment['const'];
  }
}

export class JSONSchemaEnumFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaEnumFragment = JSONSchemaEnumFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaEnumFragment {
    return fragment?.['enum'] instanceof Array;
  }

  public readonly enum: TFragment['enum'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.enum = _fragment['enum'];
  }
}

/**
 * Names of all primitive types (`null` is not one, see the null type reflection)
 */
const _JSONSchemaPrimitiveTypeNames: ReadonlyArray<JSONSchemaPrimitiveTypeName> = ['string', 'number', 'integer', 'boolean'];

export class JSONSchemaPrimitiveTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaPrimitiveTypeFragment = JSONSchemaPrimitiveTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaPrimitiveTypeFragment {
    const type = fragment?.type;
    return type instanceof Array
      ? type.every((name) => _JSONSchemaPrimitiveTypeNames.includes(name as JSONSchemaPrimitiveTypeName))
      : _JSONSchemaPrimitiveTypeNames.includes(type as JSONSchemaPrimitiveTypeName);
  }

  public readonly type: TFragment['type'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
  }
}

export class JSONSchemaNullTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNullTypeFragment = JSONSchemaNullTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaNullTypeFragment {
    return fragment?.type === 'null';
  }

  public readonly type: TFragment['type'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
  }
}

export class JSONSchemaArrayTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaArrayTypeFragment = JSONSchemaArrayTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaArrayTypeFragment {
    return fragment?.type === 'array';
  }

  public readonly type: TFragment['type'];

  /**
   * Reflections of the `items` fragment, or `undefined` if there is none. An `items` which is not a single schema object (a boolean schema, or a tuple's
   * array of schemas) has no reflections. Built eagerly on construction, unlike a reference fragment's `ref`, as the `items` fragment is nested in, and
   * owned by, this fragment, so reflecting it can not recurse back into this fragment
   */
  public readonly items: _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
    const items = _fragment['items'];
    this.items = (items === undefined ? undefined : createJSONSchemaNestedFragmentReflections(_schema, items)) as _JSONSchemaArrayTypeFragmentItemsReflect<
      TSchema,
      TFragment
    >;
  }

  // TODO: Not implemented yet (as in the type layer): tuples, i.e. `prefixItems` (or an `items` array, with `additionalItems`). Planned as a separate
  //       `prefixItems` property, holding the reflections of each position's fragment, while `items` keeps reflecting the fragment of every other item
}

/**
 * Infers the reflections of an array type fragment's `items` fragment, or `undefined` if it has none
 */
type _JSONSchemaArrayTypeFragmentItemsReflect<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaArrayTypeFragment> =
  // No items
  'items' extends keyof TFragment
    ? // Items defined
      TFragment extends { items: infer I }
      ? _JSONSchemaNestedFragmentReflect<TSchema, I>
      : // Items possibly defined
        TFragment extends { items?: infer I }
        ? _JSONSchemaNestedFragmentReflect<TSchema, Exclude<I, undefined>> | undefined
        : undefined
    : undefined;

export class JSONSchemaObjectTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaObjectTypeFragment {
    return fragment?.type === 'object' && fragment?.['properties'] === undefined;
  }

  public readonly type: TFragment['type'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.type = _fragment['type'];
  }

  // TODO: Not implemented yet (as in the type layer): `propertyNames`, `patternProperties`, `additionalProperties`, `minProperties`, `maxProperties`,
  //       `required`
}

export class JSONSchemaAllOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaAllOfTypeFragment {
    return fragment?.['allOf'] instanceof Array;
  }

  /**
   * Reflections of each `allOf` fragment, in order
   */
  public readonly allOf: _JSONSchemaNestedFragmentsReflect<TSchema, TFragment['allOf']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.allOf = _fragment['allOf'].map((fragment) => createJSONSchemaNestedFragmentReflections(_schema, fragment)) as _JSONSchemaNestedFragmentsReflect<
      TSchema,
      TFragment['allOf']
    >;
  }
}

export class JSONSchemaAnyOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaAnyOfTypeFragment {
    return fragment?.['anyOf'] instanceof Array;
  }

  /**
   * Reflections of each `anyOf` fragment, in order
   */
  public readonly anyOf: _JSONSchemaNestedFragmentsReflect<TSchema, TFragment['anyOf']>;

  /**
   * Whether this reflects an implicit `anyOf`, built from the branches of a `type` array (in which case `fragment` is the generated `anyOf` fragment), or
   * an `anyOf` keyword of the fragment itself
   */
  public readonly implicit: boolean;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment, implicit = false) {
    super(_schema, _fragmentName, _fragment);
    this.anyOf = _fragment['anyOf'].map((fragment) => createJSONSchemaNestedFragmentReflections(_schema, fragment)) as _JSONSchemaNestedFragmentsReflect<
      TSchema,
      TFragment['anyOf']
    >;
    this.implicit = implicit;
  }
}

export class JSONSchemaOneOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaOneOfTypeFragment {
    return fragment?.['oneOf'] instanceof Array;
  }

  /**
   * Reflections of each `oneOf` fragment, in order
   */
  public readonly oneOf: _JSONSchemaNestedFragmentsReflect<TSchema, TFragment['oneOf']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.oneOf = _fragment['oneOf'].map((fragment) => createJSONSchemaNestedFragmentReflections(_schema, fragment)) as _JSONSchemaNestedFragmentsReflect<
      TSchema,
      TFragment['oneOf']
    >;
  }
}

export class JSONSchemaNotTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchema7): fragment is JSONSchemaNotTypeFragment {
    return _isJSONSchemaObject(fragment?.['not']);
  }

  /**
   * Reflections of the `not` fragment
   */
  public readonly not: _JSONSchemaNestedFragmentReflect<TSchema, TFragment['not']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.not = createJSONSchemaNestedFragmentReflections(_schema, _fragment['not']) as _JSONSchemaNestedFragmentReflect<TSchema, TFragment['not']>;
  }
}

export class JSONSchemaReferenceFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaReferenceFragment = JSONSchemaReferenceFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
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
      : undefined;

/**
 * Infers the reflections of the fragment(s) referenced by name, distributing over a union of names, or `undefined` for an unresolved reference
 */
type _JSONSchemaReferenceFragmentRefReflect<TSchema extends JSONSchemaCollection, TRefName> =
  // Resolved reference
  TRefName extends JSONSchemaFragmentName<TSchema>
    ? Array<JSONSchemaFragmentReflection<TSchema, TRefName, _JSONSchemaCollectionFragment<TSchema, TRefName>>>
    : undefined;
