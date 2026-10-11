import {
  JSONSchema7,
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
  JSONSchemaFragmentPropertyName,
  JSONSchemaFragmentType,
  JSONSchemaModelFragment,
  JSONSchemaNotCollectionFragment,
  JSONSchemaNotTypeFragment,
  JSONSchemaObjectTypeFragment,
  JSONSchemaOneOfTypeFragment,
  JSONSchemaPrimitiveTypeFragment,
  JSONSchemaPrimitiveTypeName,
  JSONSchemaReferenceFragment,
} from '../schema/JSONSchema/index.js';
import { TSSchemaFragmentName } from '../schema/TSSchemaCollection.js';

export class JSONSchemaCollectionFragmentReflect<TSchema extends JSONSchemaCollection> {
  public static check(fragment: JSONSchema7) {
    return fragment?.['$defs'] instanceof Object && !(fragment?.['$defs'] instanceof Array);
  }

  public constructor(protected _schema: TSchema) {
    // Extract fragment names
    this._fragmentNames = Object.keys(this._schema['$defs']) as Array<TSSchemaFragmentName<TSchema>>;
    // Extract fragments' reflections
    this._fragmentReflections = (Object.keys(this._schema['$defs']) as Array<TSSchemaFragmentName<TSchema>>).reduce(
      (acc, key: TSSchemaFragmentName<TSchema>) => ({
        ...acc,
        [key]: _createFragmentReflections(this, key, this._schema['$defs'][key] as JSONSchemaNotCollectionFragment),
      }),
      {} as { [key in TSSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentReflect<TSchema, key, _JSONSchemaCollectionFragment<TSchema, key>>> },
    );
    // Extract the reflections of the collection's own root fragment (everything but its `$defs`)
    const { $defs: _defs, ...root } = this._schema;
    this.root = _createFragmentReflections(this, undefined, root as JSONSchemaNotCollectionFragment) as Array<
      JSONSchemaFragmentReflect<TSchema, undefined, _JSONSchemaCollectionRootFragment<TSchema>>
    >;
  }

  /**
   * Reflections of the collection's own root fragment, i.e. of the schema with its `$defs` left out. A root with no keywords besides `$defs` has none.
   */
  public readonly root: Array<JSONSchemaFragmentReflect<TSchema, undefined, _JSONSchemaCollectionRootFragment<TSchema>>>;

  protected _fragmentNames: Array<TSSchemaFragmentName<TSchema>>;
  protected _fragmentReflections: {
    [key in TSSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentReflect<TSchema, key, _JSONSchemaCollectionFragment<TSchema, key>>>;
  };

  public get names(): Array<TSSchemaFragmentName<TSchema>> {
    return [...this._fragmentNames];
  }

  public fragment<TName extends TSSchemaFragmentName<TSchema>>(
    name: TName,
  ): Array<JSONSchemaFragmentReflect<TSchema, TName, _JSONSchemaCollectionFragment<TSchema, TName>>> {
    return this._fragmentReflections[name] as Array<JSONSchemaFragmentReflect<TSchema, TName, _JSONSchemaCollectionFragment<TSchema, TName>>>;
  }
}

/**
 * Gets the root fragment of a JSON schema collection, i.e. the collection with its `$defs` left out
 */
type _JSONSchemaCollectionRootFragment<TSchema extends JSONSchemaCollection> =
  Omit<TSchema, '$defs'> extends infer F extends JSONSchemaNotCollectionFragment ? F : never;

/**
 * Gets the fragment(s) addressed by name from a JSON schema collection. A fragment which is itself a collection infers `never`.
 */
type _JSONSchemaCollectionFragment<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema>,
> = TSchema['$defs'][TName] extends infer F extends JSONSchemaNotCollectionFragment ? F : never;

/**
 * Analyses a fragment and returns instances of all fragment reflection types matching it
 * @param schema Reflection of the JSON schema collection the fragment belongs to
 * @param name Name of the fragment within the collection, or `undefined` for a nested fragment
 * @param fragment JSON fragment to reflect on
 * @returns Reflections of all fragment types the fragment matches, or an empty array if it matches none
 *
 * A `type` array naming `object` and / or `array` is split into groups of type names (`object`, `array`, and all primitive types together). A single
 * group is reflected as if `type` named it directly. Several groups are alternatives (a value is of one of them), so they are reflected as an implicit
 * `anyOf`: the type independent keywords (`const`, `enum`, `$ref`, `allOf`, `anyOf`, `oneOf`, `not`) are reflected on the fragment itself, and one more
 * any-of-types reflection holds a branch per group, each branch being the fragment with `type` narrowed to the group and the type independent keywords
 * left out.
 */
function _createFragmentReflections<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
>(schema: JSONSchemaCollectionFragmentReflect<TSchema>, name: TName, fragment: TFragment): Array<JSONSchemaFragmentReflect<TSchema, TName, TFragment>> {
  // Split a type array naming non primitive types into groups of type names
  const typeGroups = _getFragmentTypeGroups(fragment);
  if (typeGroups !== undefined && typeGroups.length === 1)
    return _createFragmentReflections(schema, name, { ...fragment, type: typeGroups[0] } as JSONSchemaNotCollectionFragment) as Array<
      JSONSchemaFragmentReflect<TSchema, TName, TFragment>
    >;

  const reflections: Array<JSONSchemaFragmentReflect<TSchema, TName, TFragment>> = [];
  if (JSONSchemaModelFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaModelFragmentReflect<TSchema, TName, TFragment & JSONSchemaModelFragment>(schema, name, fragment as TFragment & JSONSchemaModelFragment),
    );
  if (JSONSchemaConstFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaConstFragmentReflect<TSchema, TName, TFragment & JSONSchemaConstFragment>(schema, name, fragment as TFragment & JSONSchemaConstFragment),
    );
  if (JSONSchemaEnumFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaEnumFragmentReflect<TSchema, TName, TFragment & JSONSchemaEnumFragment>(schema, name, fragment as TFragment & JSONSchemaEnumFragment),
    );
  if (JSONSchemaPrimitiveTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaPrimitiveTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaPrimitiveTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaPrimitiveTypeFragment,
      ),
    );
  if (JSONSchemaArrayTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaArrayTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaArrayTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaArrayTypeFragment,
      ),
    );
  if (JSONSchemaObjectTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaObjectTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaObjectTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaObjectTypeFragment,
      ),
    );
  if (typeGroups !== undefined && typeGroups.length > 1) {
    const branchFragment = Object.fromEntries(
      Object.entries(fragment).filter(([keyword]) => !(_JSONSchemaTypeIndependentKeywords as ReadonlyArray<string>).includes(keyword)),
    );
    const anyOfFragment: JSONSchemaAnyOfTypeFragment = { anyOf: typeGroups.map((type) => ({ ...branchFragment, type }) as JSONSchemaNotCollectionFragment) };
    reflections.push(
      new JSONSchemaAnyOfTypeFragmentReflect<TSchema, TName>(schema, name, anyOfFragment) as unknown as JSONSchemaFragmentReflect<TSchema, TName, TFragment>,
    );
  }
  if (JSONSchemaAllOfTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaAllOfTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaAllOfTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaAllOfTypeFragment,
      ),
    );
  if (JSONSchemaAnyOfTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaAnyOfTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaAnyOfTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaAnyOfTypeFragment,
      ),
    );
  if (JSONSchemaOneOfTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaOneOfTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaOneOfTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaOneOfTypeFragment,
      ),
    );
  if (JSONSchemaNotTypeFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaNotTypeFragmentReflect<TSchema, TName, TFragment & JSONSchemaNotTypeFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaNotTypeFragment,
      ),
    );
  if (JSONSchemaReferenceFragmentReflect.check(fragment))
    reflections.push(
      new JSONSchemaReferenceFragmentReflect<TSchema, TName, TFragment & JSONSchemaReferenceFragment>(
        schema,
        name,
        fragment as TFragment & JSONSchemaReferenceFragment,
      ),
    );
  return reflections;
}

/**
 * Keywords which constrain a value regardless of its type, and are reflected by their own fragment reflection types
 */
const _JSONSchemaTypeIndependentKeywords = ['const', 'enum', '$ref', 'allOf', 'anyOf', 'oneOf', 'not'] as const;

/**
 * Splits a fragment's `type` array into groups of type names: `object`, `array`, and all primitive types together
 * @param fragment JSON fragment whose `type` to split
 * @returns Type of each group (a primitive group as an array of type names), or `undefined` if `type` is not an array naming `object` or `array`
 */
function _getFragmentTypeGroups(fragment: JSONSchemaNotCollectionFragment): Array<'object' | 'array' | Array<JSONSchemaPrimitiveTypeName>> | undefined {
  const type = fragment?.type;
  if (!(type instanceof Array) || !(type.includes('object') || type.includes('array'))) return undefined;
  const primitives = type.filter((name) => _JSONSchemaPrimitiveTypeNames.includes(name as JSONSchemaPrimitiveTypeName)) as Array<JSONSchemaPrimitiveTypeName>;
  return [
    ...(type.includes('object') ? ['object' as const] : []),
    ...(type.includes('array') ? ['array' as const] : []),
    ...(primitives.length ? [primitives] : []),
  ];
}

/**
 * Reflects a fragment nested in, and owned by, another fragment (e.g. a model property or an `allOf` member). Nested fragments have no name.
 * @param schema Reflection of the JSON schema collection the parent fragment belongs to
 * @param fragment Nested JSON fragment to reflect on
 * @returns Reflections of all fragment types the nested fragment matches, or an empty array if it is not a fragment object (e.g. a boolean schema)
 */
function _createNestedFragmentReflections<TSchema extends JSONSchemaCollection>(
  schema: JSONSchemaCollectionFragmentReflect<TSchema>,
  fragment: unknown,
): Array<JSONSchemaFragmentReflect<TSchema, undefined>> {
  return fragment instanceof Object && !(fragment instanceof Array)
    ? _createFragmentReflections(schema, undefined, fragment as JSONSchemaNotCollectionFragment)
    : [];
}

/**
 * Infers the reflections of a fragment nested in another fragment. A nested type which is not a (non-collection) fragment infers the reflections of an
 * unspecified fragment.
 */
type _JSONSchemaNestedFragmentReflect<TSchema extends JSONSchemaCollection, TFragment> = Array<
  JSONSchemaFragmentReflect<TSchema, undefined, TFragment extends JSONSchemaNotCollectionFragment ? TFragment : JSONSchemaNotCollectionFragment>
>;

/**
 * Infers the reflections of each fragment in an array of nested fragments, element by element for a tuple
 */
type _JSONSchemaNestedFragmentsReflect<TSchema extends JSONSchemaCollection, TFragments extends ReadonlyArray<unknown>> = {
  -readonly [I in keyof TFragments]: _JSONSchemaNestedFragmentReflect<TSchema, TFragments[I]>;
};

export abstract class JSONSchemaFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
> {
  /**
   * This accessor should never be accessed in runtime, it is only meant to be used for type inference convenience: `typeof reflect.Type`
   */
  public get Type(): JSONSchemaFragmentType<TFragment, TSchema> {
    throw new Error('This accessor should never be accessed, it is only meant to be used for type inference convenience: `typeof reflect.Type`');
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
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.type === 'object' && fragment?.['properties'] instanceof Object;
  }

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
    this.names = Object.keys(_fragment['properties']) as Array<JSONSchemaFragmentPropertyName<TFragment>>;
    this.properties = Object.fromEntries(
      Object.entries(_fragment['properties']).map(([name, property]) => [name, _createNestedFragmentReflections(_schema, property)]),
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
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaConstFragment = JSONSchemaConstFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return 'const' in fragment;
  }

  public readonly const: TFragment['const'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.const = _fragment['const'];
  }
}

export class JSONSchemaEnumFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaEnumFragment = JSONSchemaEnumFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['enum'] instanceof Array;
  }

  public readonly enum: TFragment['enum'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.enum = _fragment['enum'];
  }
}

/**
 * Names of all primitive types
 */
const _JSONSchemaPrimitiveTypeNames: ReadonlyArray<JSONSchemaPrimitiveTypeName | 'null'> = ['string', 'number', 'integer', 'boolean', 'null'];

export class JSONSchemaPrimitiveTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaPrimitiveTypeFragment = JSONSchemaPrimitiveTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
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

export class JSONSchemaArrayTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaArrayTypeFragment = JSONSchemaArrayTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.type === 'array';
  }

  /**
   * Reflections of the `items` fragment. Built eagerly on construction, unlike a reference fragment's `ref`, as the `items` fragment is nested in, and
   * owned by, this fragment, so reflecting it can not recurse back into this fragment
   */
  public readonly items: _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    const items = _fragment['items'];
    this.items = (
      items instanceof Object && !(items instanceof Array) ? _createFragmentReflections(_schema, undefined, items) : undefined
    ) as _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;
  }

  // TODO: Not implemented yet (as in the type layer): tuples, i.e. `prefixItems` (or an `items` array, with `additionalItems`). Planned as a separate
  //       `prefixItems` property, holding the reflections of each position's fragment, while `items` keeps reflecting the fragment of every other item
}

/**
 * Infers the reflections of an array type fragment's `items` fragment, or `undefined` if it has none
 */
type _JSONSchemaArrayTypeFragmentItemsReflect<TSchema extends JSONSchemaCollection, TFragment extends JSONSchemaArrayTypeFragment> =
  // Items defined
  TFragment extends { items: infer I extends JSONSchemaNotCollectionFragment }
    ? Array<JSONSchemaFragmentReflect<TSchema, undefined, I>>
    : // Items possibly defined
      TFragment extends { items?: infer I }
      ? Exclude<I, undefined> extends infer J extends JSONSchemaNotCollectionFragment
        ? Array<JSONSchemaFragmentReflect<TSchema, undefined, J>> | undefined
        : undefined
      : undefined;

export class JSONSchemaObjectTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
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
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['allOf'] instanceof Array;
  }

  /**
   * Reflections of each `allOf` fragment, in order
   */
  public readonly allOf: _JSONSchemaNestedFragmentsReflect<TSchema, TFragment['allOf']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.allOf = _fragment['allOf'].map((fragment) => _createNestedFragmentReflections(_schema, fragment)) as _JSONSchemaNestedFragmentsReflect<
      TSchema,
      TFragment['allOf']
    >;
  }
}

export class JSONSchemaAnyOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['anyOf'] instanceof Array;
  }

  /**
   * Reflections of each `anyOf` fragment, in order
   */
  public readonly anyOf: _JSONSchemaNestedFragmentsReflect<TSchema, TFragment['anyOf']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.anyOf = _fragment['anyOf'].map((fragment) => _createNestedFragmentReflections(_schema, fragment)) as _JSONSchemaNestedFragmentsReflect<
      TSchema,
      TFragment['anyOf']
    >;
  }
}

export class JSONSchemaOneOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['oneOf'] instanceof Array;
  }

  /**
   * Reflections of each `oneOf` fragment, in order
   */
  public readonly oneOf: _JSONSchemaNestedFragmentsReflect<TSchema, TFragment['oneOf']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.oneOf = _fragment['oneOf'].map((fragment) => _createNestedFragmentReflections(_schema, fragment)) as _JSONSchemaNestedFragmentsReflect<
      TSchema,
      TFragment['oneOf']
    >;
  }
}

export class JSONSchemaNotTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['not'] instanceof Object;
  }

  /**
   * Reflections of the `not` fragment
   */
  public readonly not: _JSONSchemaNestedFragmentReflect<TSchema, TFragment['not']>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.not = _createNestedFragmentReflections(_schema, _fragment['not']) as _JSONSchemaNestedFragmentReflect<TSchema, TFragment['not']>;
  }
}

export class JSONSchemaReferenceFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaReferenceFragment = JSONSchemaReferenceFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
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
      this.refName === undefined ? undefined : this._schema.fragment(this.refName as TSSchemaFragmentName<TSchema>)
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
    ? TSSchemaFragmentName<TSchema> | undefined
    : // Reference to a fragment of the collection
      TFragment['$ref'] extends `#/$defs/${infer N}`
      ? N extends TSSchemaFragmentName<TSchema>
        ? N
        : undefined
      : undefined;

/**
 * Infers the reflections of the fragment(s) referenced by name, distributing over a union of names, or `undefined` for an unresolved reference
 */
type _JSONSchemaReferenceFragmentRefReflect<TSchema extends JSONSchemaCollection, TRefName> =
  // Resolved reference
  TRefName extends TSSchemaFragmentName<TSchema>
    ? Array<JSONSchemaFragmentReflect<TSchema, TRefName, _JSONSchemaCollectionFragment<TSchema, TRefName>>>
    : undefined;
