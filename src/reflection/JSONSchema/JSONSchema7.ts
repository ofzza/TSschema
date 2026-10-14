/**
 * Runtime counterparts of the JSON Schema Draft 7 type utilities: the primitive type names, telling schema objects apart from boolean schemas, naming
 * `const` / `enum` values, and reading any keyword's value (validation keywords, annotations, vendor keywords) by its value type.
 */

import type { JSONSchemaPrimitiveTypeName } from '../../schema/JSONSchema/index.js';

/**
 * Names of all primitive types. `null` is not a primitive type here: like `object` and `array`, it has a fragment facet of its own.
 */
export const JSONSchemaPrimitiveTypeNames: ReadonlyArray<JSONSchemaPrimitiveTypeName> = ['string', 'number', 'integer', 'boolean'];

/**
 * Determines if a value is a primitive type name
 * @param value Value to check
 * @returns `true` if the value names a primitive type
 */
export function isJSONSchemaPrimitiveTypeName(value: unknown): value is JSONSchemaPrimitiveTypeName {
  return JSONSchemaPrimitiveTypeNames.includes(value as JSONSchemaPrimitiveTypeName);
}

/**
 * Determines if a value is a (non-array) object, i.e. a JSON schema object rather than a boolean schema or an array
 * @param value Value to check
 * @returns `true` if the value is a non-array object
 */
export function isJSONSchemaObject(value: unknown): value is object {
  return value instanceof Object && !(value instanceof Array);
}

/**
 * Gets the name of a `const` or `enum` value, used where the schema names none: a string is its own name, any other primitive (number, boolean, `null`)
 * its string form, and an object or array its JSON. The runtime counterpart of `JSONSchemaValueName`.
 * @param value Value to name
 * @returns Name of the value
 */
export function getJSONSchemaValueName<TValue>(value: TValue): JSONSchemaValueName<TValue> {
  return (
    typeof value === 'string' ? value : value === null || typeof value !== 'object' ? String(value) : JSON.stringify(value)
  ) as JSONSchemaValueName<TValue>;
}

/**
 * Infers the name of a `const` or `enum` value (see `getJSONSchemaValueName`): a string literal as is, any other primitive literal in its string form, and
 * `string` for an object or array
 */
export type JSONSchemaValueName<TValue> =
  // String
  TValue extends string
    ? TValue
    : // Any other primitive
      TValue extends number | boolean | null | undefined | bigint
      ? `${TValue}`
      : // Object or array
        string;

/**
 * JSON value types a keyword's value can be required to be of (see `getJSONSchemaKeyword`): `unknown` accepts any value
 */
export type JSONSchemaKeywordValueType = 'number' | 'string' | 'boolean' | 'array' | 'unknown';

/**
 * Gets the value of a keyword of a JSON schema fragment, if the fragment is a schema object and the value is of the given JSON value type, or `undefined`
 * otherwise. Reads keywords the `JSONSchema7` type does not declare (e.g. `deprecated`, `x-decorators`) as well. The runtime counterpart of
 * `JSONSchemaKeyword`.
 * @param fragment JSON fragment to read the keyword of
 * @param keyword Name of the keyword
 * @param type JSON value type the keyword's value must be of
 * @returns Value of the keyword, or `undefined` if it is absent or of another value type
 */
export function getJSONSchemaKeyword(fragment: unknown, keyword: string, type: JSONSchemaKeywordValueType): unknown {
  if (!isJSONSchemaObject(fragment)) return undefined;
  const value = (fragment as Record<string, unknown>)[keyword];
  if (type === 'unknown') return value;
  if (type === 'array') return value instanceof Array ? value : undefined;
  return typeof value === type ? value : undefined;
}

/**
 * Infers the value of a keyword of a JSON schema fragment, if of the given value type (see `getJSONSchemaKeyword`): the keyword's (literal) value type,
 * `undefined` if the fragment has no such keyword or its value is of another type, and both if the keyword is optional. Distributes over a union of
 * fragments.
 */
export type JSONSchemaKeyword<TFragment, TKeyword extends string, TValue = unknown> =
  // Distribute over a union of fragments
  TFragment extends unknown
    ? // Keyword known
      TKeyword extends keyof TFragment
      ? _JSONSchemaKeywordValue<Exclude<TFragment[TKeyword], undefined>, TValue> | (undefined extends TFragment[TKeyword] ? undefined : never)
      : // No such keyword
        undefined
    : never;

/**
 * Infers a keyword's value if of the given value type, or `undefined` otherwise, distributing over a union of values
 */
type _JSONSchemaKeywordValue<TKeywordValue, TValue> = TKeywordValue extends TValue ? TKeywordValue : undefined;
