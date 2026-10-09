/**
 * Typescript utilities for JSON schema primitive `type` fragments: detection and value type inference.
 */

import type { JSONSchema7, JSONSchemaPrimitiveTypeName, JSONSchemaPrimitiveTypeFromName } from './JSONSchema7.js';
import type { JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

/**
 * Represents a JSON schema primitive type definition, which is any schema fragment containing a `type` property naming a primitive type, or an array of
 * primitive type names.
 * TODO: Support `type` arrays of primitive types: example `["number", "string"]`
 */
export type JSONSchemaPrimitiveTypeFragment = JSONSchemaNotCollectionFragment & {
  type: JSONSchemaPrimitiveTypeName | ReadonlyArray<JSONSchemaPrimitiveTypeName>;
};
/**
 * Determines if a JSON schema fragment is a primitive type definition (i.e., contains a `type` property naming a primitive type, or an array of primitive
 * type names).
 */
export type JSONSchemaFragmentIsPrimitiveType<T extends JSONSchema7> = T extends JSONSchemaPrimitiveTypeFragment ? true : false;
/**
 * Infers a value type from a JSON schema primitive type definition. An array of type names infers the union of their types.
 */
export type JSONSchemaPrimitiveTypeFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends {
  type: infer U extends JSONSchemaPrimitiveTypeName | ReadonlyArray<JSONSchemaPrimitiveTypeName>;
}
  ? U extends ReadonlyArray<JSONSchemaPrimitiveTypeName>
    ? JSONSchemaPrimitiveTypeFromName<U[number]>
    : U extends JSONSchemaPrimitiveTypeName
      ? JSONSchemaPrimitiveTypeFromName<U>
      : unknown
  : unknown;
