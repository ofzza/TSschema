/**
 * Runtime reflection of JSON schemas. Internal for now: not re-exported from the package's entry points.
 *
 * Re-exports the JSON schema fragment facets in `./JSONSchema/` (the parsed form of a schema), until the TSSchema* reflection classes wrapping them are
 * built here.
 */
import { JSONSchema7, JSONSchemaFragmentPropertyName, JSONSchemaModelFragment } from '../schema/JSONSchema/index.js';
import { JSONSchemaCollection, JSONSchemaFragmentName, JSONSchemaNotCollectionFragment } from '../schema/JSONSchema';
import { JSONSchemaCollectionFragmentFacet, JSONSchemaFragmentFacet, JSONSchemaModelFragmentFacet } from './JSONSchema';

export class TSSchemaReflection<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaFragmentName<TSchema> | undefined = JSONSchemaFragmentName<TSchema> | undefined,
  TFragment extends JSONSchema7 = JSONSchemaNotCollectionFragment,
  TFragmentFacet extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> = JSONSchemaFragmentFacet<TSchema, TName, TFragment>,
> {
  /**
   * JSON schema fragment note to perform reflection on
   */
  protected _facets: Array<TFragmentFacet>;

  /**
   * (Optional) JSON schema collection as context for resolving references
   */
  protected _context: JSONSchemaCollectionFragmentFacet<TSchema> | undefined = undefined;

  /**
   * TSSchema fragment reflection constructor
   * @param facets JSONSChema fragment facets to perform reflection based off of
   * @param context (Optional) JSONSChema fragment collection facet, to be used to resolve references
   */
  protected constructor(facets: Array<TFragmentFacet>, context: JSONSchemaCollectionFragmentFacet<TSchema> | undefined = undefined) {
    this._facets = facets;
    this._context = context;
  }

  public getTypeDescriptor(): TSSchemaTypeDescriptor {
    return new TSSchemaTypeDescriptor();
  }

  public getChildNames(): TFragment extends JSONSchemaCollection
    ? Array<JSONSchemaFragmentName<TFragment>>
    : TFragment extends JSONSchemaModelFragment
      ? Array<JSONSchemaFragmentPropertyName<TFragment>>
      : [] {
    return (this._facets.find((fragment) => fragment instanceof JSONSchemaCollectionFragmentFacet || fragment instanceof JSONSchemaModelFragmentFacet)?.names ??
      []) as TFragment extends JSONSchemaCollection
      ? Array<JSONSchemaFragmentName<TFragment>>
      : TFragment extends JSONSchemaModelFragment
        ? Array<JSONSchemaFragmentPropertyName<TFragment>>
        : [];
  }

  public getChild(name: JSONSchemaFragmentName<TSchema>) {
    // If can be interpreted as JSONSchemaCollectionFragmentFacet, return child fragment reflection
    const childFragment = this._facets.find((fragment) => fragment instanceof JSONSchemaCollectionFragmentFacet)?.$defs[name];
    if (childFragment) return new TSSchemaReflection(childFragment, this._context);
    // If can be interpreted as JSONSchemaModelFragmentFacet, return child fragment reflection
    const childProperty = this._facets.find((fragment) => fragment instanceof JSONSchemaModelFragmentFacet)?.properties[name];
    if (childProperty) return new TSSchemaReflection(childProperty, this._context);
    // Fallback to child can't be resolved
    return undefined;
  }
}

class TSSchemaTypeDescriptor {
  // TODO: Design and implement a structure using which it'll be possible to determine all relevant information about a fragment's type
}
