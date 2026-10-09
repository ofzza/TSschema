/**
 * Typescript utilities for JSON schema `const` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

/**
 * Represents a JSON schema const definition, which is any schema fragment containing a `const` property.
 */
export type JSONSchemaConstFragment = JSONSchemaNotCollectionFragment & { const: unknown };
/**
 * Determines if a JSON schema fragment is a const definition (i.e., contains a `const` property).
 */
export type JSONSchemaFragmentIsConst<T extends JSONSchema7> = T extends JSONSchemaConstFragment ? true : false;
/**
 * Infers a value type from a JSON schema const definition
 */
export type JSONSchemaConstFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { const: infer C } ? C : unknown;
