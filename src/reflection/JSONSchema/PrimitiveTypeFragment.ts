/**
 * Facets of JSON schema primitive `type` fragments (`string`, `number`, `integer`, `boolean`; `null` has a fragment facet of its own): the
 * primitive type name(s), and the validation keywords applying to numbers and strings.
 */

import type { JSONSchema7, JSONSchemaCollection, JSONSchemaDefinitionName, JSONSchemaPrimitiveTypeFragment } from '../../schema/JSONSchema/index.js';
import { JSONSchemaFragmentFacet, type JSONSchemaFragmentFacetOptions } from './Fragment.js';
import { getJSONSchemaKeyword, isJSONSchemaPrimitiveTypeName, type JSONSchemaKeyword } from './JSONSchema7.js';

/**
 * Parses a JSON schema primitive type definition, which is any schema fragment containing a `type` property naming a primitive type, or an array of
 * primitive type names. Parses the validation keywords of numbers and strings too, each `undefined` if absent or not of the keyword's value type: which
 * of them apply depends on the type, so the type descriptor of each primitive type keeps only its own (see `getTSSchemaTypeDescriptor`).
 */
export class JSONSchemaPrimitiveTypeFragmentFacet<
  TSchema extends JSONSchemaCollection,
  TName extends JSONSchemaDefinitionName<TSchema> | undefined = JSONSchemaDefinitionName<TSchema> | undefined,
  TFragment extends JSONSchemaPrimitiveTypeFragment = JSONSchemaPrimitiveTypeFragment,
> extends JSONSchemaFragmentFacet<TSchema, TName, TFragment> {
  /**
   * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property naming a primitive type, or an array of
   * primitive type names only). The runtime counterpart of `JSONSchemaFragmentIsPrimitiveType`.
   * @param fragment JSON fragment to check
   * @returns `true` if the fragment is a primitive type definition
   */
  public static is(fragment: JSONSchema7): fragment is JSONSchemaPrimitiveTypeFragment {
    const type = fragment?.type;
    return type instanceof Array ? type.every((name) => isJSONSchemaPrimitiveTypeName(name)) : isJSONSchemaPrimitiveTypeName(type);
  }

  /**
   * The fragment's `type`: a primitive type name, or an array of primitive type names
   */
  public readonly type: TFragment['type'];

  /**
   * The fragment's `minimum` (an inclusive lower bound of a number), or `undefined` if it has none
   */
  public readonly minimum: JSONSchemaKeyword<TFragment, 'minimum', number>;

  /**
   * The fragment's `maximum` (an inclusive upper bound of a number), or `undefined` if it has none
   */
  public readonly maximum: JSONSchemaKeyword<TFragment, 'maximum', number>;

  /**
   * The fragment's `exclusiveMinimum` (an exclusive lower bound of a number), or `undefined` if it has none (or only the draft 4 boolean form)
   */
  public readonly exclusiveMinimum: JSONSchemaKeyword<TFragment, 'exclusiveMinimum', number>;

  /**
   * The fragment's `exclusiveMaximum` (an exclusive upper bound of a number), or `undefined` if it has none (or only the draft 4 boolean form)
   */
  public readonly exclusiveMaximum: JSONSchemaKeyword<TFragment, 'exclusiveMaximum', number>;

  /**
   * The fragment's `multipleOf` (a number must be a multiple of it), or `undefined` if it has none
   */
  public readonly multipleOf: JSONSchemaKeyword<TFragment, 'multipleOf', number>;

  /**
   * The fragment's `minLength` (the minimum length of a string), or `undefined` if it has none
   */
  public readonly minLength: JSONSchemaKeyword<TFragment, 'minLength', number>;

  /**
   * The fragment's `maxLength` (the maximum length of a string), or `undefined` if it has none
   */
  public readonly maxLength: JSONSchemaKeyword<TFragment, 'maxLength', number>;

  /**
   * The fragment's `pattern` (a regular expression a string must match), or `undefined` if it has none
   */
  public readonly pattern: JSONSchemaKeyword<TFragment, 'pattern', string>;

  /**
   * The fragment's `format` (e.g. `"date"`, `"uuid"`, `"email"`), or `undefined` if it has none
   */
  public readonly format: JSONSchemaKeyword<TFragment, 'format', string>;

  /**
   * The fragment's `contentEncoding` (e.g. `"base64"`), or `undefined` if it has none
   */
  public readonly contentEncoding: JSONSchemaKeyword<TFragment, 'contentEncoding', string>;

  /**
   * Parses a JSON schema primitive type definition
   * @param fragment JSON fragment to parse
   * @param options Collection and name of the parsed fragment (see `JSONSchemaFragmentFacetOptions`)
   */
  public constructor(fragment: TFragment, options: JSONSchemaFragmentFacetOptions<TSchema, TName> = {}) {
    super(fragment, options);
    this.type = fragment['type'];
    this.minimum = getJSONSchemaKeyword(fragment, 'minimum', 'number') as JSONSchemaKeyword<TFragment, 'minimum', number>;
    this.maximum = getJSONSchemaKeyword(fragment, 'maximum', 'number') as JSONSchemaKeyword<TFragment, 'maximum', number>;
    this.exclusiveMinimum = getJSONSchemaKeyword(fragment, 'exclusiveMinimum', 'number') as JSONSchemaKeyword<TFragment, 'exclusiveMinimum', number>;
    this.exclusiveMaximum = getJSONSchemaKeyword(fragment, 'exclusiveMaximum', 'number') as JSONSchemaKeyword<TFragment, 'exclusiveMaximum', number>;
    this.multipleOf = getJSONSchemaKeyword(fragment, 'multipleOf', 'number') as JSONSchemaKeyword<TFragment, 'multipleOf', number>;
    this.minLength = getJSONSchemaKeyword(fragment, 'minLength', 'number') as JSONSchemaKeyword<TFragment, 'minLength', number>;
    this.maxLength = getJSONSchemaKeyword(fragment, 'maxLength', 'number') as JSONSchemaKeyword<TFragment, 'maxLength', number>;
    this.pattern = getJSONSchemaKeyword(fragment, 'pattern', 'string') as JSONSchemaKeyword<TFragment, 'pattern', string>;
    this.format = getJSONSchemaKeyword(fragment, 'format', 'string') as JSONSchemaKeyword<TFragment, 'format', string>;
    this.contentEncoding = getJSONSchemaKeyword(fragment, 'contentEncoding', 'string') as JSONSchemaKeyword<TFragment, 'contentEncoding', string>;
  }
}
