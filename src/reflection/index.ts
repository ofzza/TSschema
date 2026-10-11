import {
  JSONSchema7,
  JSONSchemaAllOfTypeFragment,
  JSONSchemaAnyOfTypeFragment,
  JSONSchemaArrayTypeFragment,
  JSONSchemaCollection,
  JSONSchemaConstFragment,
  JSONSchemaEnumFragment,
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
  }

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
 */
function _createFragmentReflections<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchemaNotCollectionFragment,
>(schema: JSONSchemaCollectionFragmentReflect<TSchema>, name: TName, fragment: TFragment): Array<JSONSchemaFragmentReflect<TSchema, TName, TFragment>> {
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
}

export class JSONSchemaModelFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaModelFragment = JSONSchemaModelFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.type === 'object' && fragment?.['properties'] instanceof Object;
  }

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract property names
  // TODO: Extract property fragments
}

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
const _JSONSchemaPrimitiveTypeNames: ReadonlyArray<JSONSchemaPrimitiveTypeName> = ['string', 'number', 'integer', 'boolean', 'null'];

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

  public readonly items: _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    const items = _fragment['items'];
    this.items = (
      items instanceof Object && !(items instanceof Array) ? _createFragmentReflections(_schema, undefined, items) : undefined
    ) as _JSONSchemaArrayTypeFragmentItemsReflect<TSchema, TFragment>;
  }
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

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract type(s)
}

export class JSONSchemaAllOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAllOfTypeFragment = JSONSchemaAllOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['allOf'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments(s)
}

export class JSONSchemaAnyOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaAnyOfTypeFragment = JSONSchemaAnyOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['anyOf'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments(s)
}

export class JSONSchemaOneOfTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaOneOfTypeFragment = JSONSchemaOneOfTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['oneOf'] instanceof Array;
  }

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments(s)
}

export class JSONSchemaNotTypeFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaNotTypeFragment = JSONSchemaNotTypeFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return fragment?.['not'] instanceof Object;
  }

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
  }

  // TODO: Extract fragments
}

export class JSONSchemaReferenceFragmentReflect<
  TSchema extends JSONSchemaCollection,
  TName extends TSSchemaFragmentName<TSchema> | undefined = TSSchemaFragmentName<TSchema>,
  TFragment extends JSONSchemaReferenceFragment = JSONSchemaReferenceFragment,
> extends JSONSchemaFragmentReflect<TSchema, TName, TFragment> {
  public static check(fragment: JSONSchemaNotCollectionFragment) {
    return typeof fragment?.['$ref'] === 'string';
  }

  public readonly ref: TFragment['$ref'];

  public constructor(_schema: JSONSchemaCollectionFragmentReflect<TSchema>, _fragmentName: TName, _fragment: TFragment) {
    super(_schema, _fragmentName, _fragment);
    this.ref = _fragment['$ref'];
  }
}
