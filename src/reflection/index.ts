import {
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
  JSONSchemaFragmentName,
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
import { TSSchemaFragmentType } from '../schema/TSSchemaFragment.js';

export class JSONSchemaCollectionReflect<TSchema extends JSONSchemaCollection> {
  public constructor(protected _schema: TSchema) {
    // Extract fragment names
    this._fragmentNames = Object.keys(this._schema['$defs']) as Array<TSSchemaFragmentName<TSchema>>;
    // Extract fragments' reflections
    this._fragmentReflections = (Object.keys(this._schema['$defs']) as Array<TSSchemaFragmentName<TSchema>>).reduce(
      (acc, key: TSSchemaFragmentName<TSchema>) => ({
        ...acc,
        [key]: _createFragmentReflections(this, key, this._schema['$defs'][key] as JSONSchemaNotCollectionFragment),
      }),
      {} as { [key in TSSchemaFragmentName<TSchema>]: Array<JSONSchemaFragmentReflect<TSchema, key>> },
    );
  }

  protected _fragmentNames: Array<TSSchemaFragmentName<TSchema>>;
  protected _fragmentReflections: Record<TSSchemaFragmentName<TSchema>, Array<JSONSchemaFragmentReflect<TSchema>>>;

  public get names(): Array<TSSchemaFragmentName<TSchema>> {
    return [...this._fragmentNames];
  }

  public fragment<TName extends TSSchemaFragmentName<TSchema>>(name: TName): Array<JSONSchemaFragmentReflect<TSchema, TName>> {
    return this._fragmentReflections[name] as Array<JSONSchemaFragmentReflect<TSchema, TName>>;
  }
}

/**
 * Analyses a fragment and returns instances of all fragment reflection types matching it
 * @param schema Reflection of the JSON schema collection the fragment belongs to
 * @param name Name of the fragment within the collection
 * @param fragment JSON fragment to reflect on
 * @returns Reflections of all fragment types the fragment matches, or an empty array if it matches none
 */
function _createFragmentReflections<TSchema extends JSONSchemaCollection, TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>>(
  schema: JSONSchemaCollectionReflect<TSchema>,
  name: TName,
  fragment: JSONSchemaNotCollectionFragment,
): Array<JSONSchemaFragmentReflect<TSchema, TName>> {
  const reflections: Array<JSONSchemaFragmentReflect<TSchema, TName>> = [];
  if (JSONSchemaModelFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaModelFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaModelFragment));
  if (JSONSchemaConstFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaConstFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaConstFragment));
  if (JSONSchemaEnumFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaEnumFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaEnumFragment));
  if (JSONSchemaPrimitiveTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaPrimitiveTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaPrimitiveTypeFragment));
  if (JSONSchemaArrayTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaArrayTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaArrayTypeFragment));
  if (JSONSchemaObjectTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaObjectTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaObjectTypeFragment));
  if (JSONSchemaAllOfTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaAllOfTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaAllOfTypeFragment));
  if (JSONSchemaAnyOfTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaAnyOfTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaAnyOfTypeFragment));
  if (JSONSchemaOneOfTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaOneOfTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaOneOfTypeFragment));
  if (JSONSchemaNotTypeFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaNotTypeFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaNotTypeFragment));
  if (JSONSchemaReferenceFragmentReflect.check(fragment))
    reflections.push(new JSONSchemaReferenceFragmentReflect<TSchema, TName>(schema, name, fragment as JSONSchemaReferenceFragment));
  return reflections;
}

/**
 * Infers the value type of the fragment(s) addressed by name from a JSON schema collection, distributing over a union of names. Takes an unconstrained
 * name and narrows it itself, as forwarding a name constrained by a conditional type into `TSSchemaFragment` can not be type checked while the collection
 * is generic. A name which does not address a fragment of the collection infers `never`.
 */
type _JSONSchemaFragmentReflectType<TSchema extends JSONSchemaCollection, TName> =
  // Distribute over a union of names, and narrow each against the collection
  TName extends JSONSchemaFragmentName<TSchema>
    ? TSchema['$defs'][TName] extends infer F extends JSONSchemaNotCollectionFragment
      ? TSSchemaFragmentType<F, TSchema>
      : never
    : never;

export abstract class JSONSchemaFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotCollectionFragment = JSONSchemaNotCollectionFragment,
> {
  /**
   * This accessor should never be accessed in runtime, it is only meant to be used for type inference convenience: `typeof reflect.Type`
   */
  public get Type(): _JSONSchemaFragmentReflectType<TSchema, TName> {
    throw new Error('This accessor should never be accessed, it is only meant to be used for type inference convenience: `typeof reflect.Type`');
  }

  public constructor(
    protected _schema: JSONSchemaCollectionReflect<TSchema>,
    protected _fragmentName: TName,
    protected _fragment: TFragment,
  ) {}
}

export class JSONSchemaModelFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.type === 'object' && fragment?.['properties'] instanceof Object;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract property names
  // TODO: Extract property fragments
}

export class JSONSchemaConstFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaConstFragment = JSONSchemaConstFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return 'const' in fragment;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract const value
}

export class JSONSchemaEnumFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaEnumFragment = JSONSchemaEnumFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['enum'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract enum values
}

/**
 * Names of all primitive types
 */
const _JSONSchemaPrimitiveTypeNames: ReadonlyArray<JSONSchemaPrimitiveTypeName> = ['string', 'number', 'integer', 'boolean', 'null'];

export class JSONSchemaPrimitiveTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaPrimitiveTypeFragment = JSONSchemaPrimitiveTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    const type = fragment?.type;
    return type instanceof Array
      ? type.every((name) => _JSONSchemaPrimitiveTypeNames.includes(name as JSONSchemaPrimitiveTypeName))
      : _JSONSchemaPrimitiveTypeNames.includes(type as JSONSchemaPrimitiveTypeName);
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract type(s)
}

export class JSONSchemaArrayTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaArrayTypeFragment = JSONSchemaArrayTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.type === 'array';
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract type(s)
}

export class JSONSchemaObjectTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaObjectTypeFragment = JSONSchemaObjectTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.type === 'object' && fragment?.['properties'] === undefined;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract type(s)
}

export class JSONSchemaAllOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['allOf'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments(s)
}

export class JSONSchemaAnyOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['anyOf'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments(s)
}

export class JSONSchemaOneOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['oneOf'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments(s)
}

export class JSONSchemaNotTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['not'] instanceof Object;
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments
}

export class JSONSchemaReferenceFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaReferenceFragment = JSONSchemaReferenceFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return typeof fragment?.['$ref'] === 'string';
  }

  public constructor(_schema: JSONSchemaCollectionReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract reference
}
