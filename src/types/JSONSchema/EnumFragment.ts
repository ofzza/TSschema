/**
 * Typescript utilities for JSON schema `enum` fragments: detection and value type inference.
 */

import type { JSONSchema7 } from './JSONSchema7.js';
import type { JSONSchemaNotCollectionFragment } from './CollectionFragment.js';

/**
 * Represents a JSON schema enum definition, which is any schema fragment containing an `enum` property.
 */
export type JSONSchemaEnumFragment = JSONSchemaNotCollectionFragment & { enum: ReadonlyArray<unknown> };
/**
 * Determines if a JSON schema fragment is an enum definition (i.e., contains an `enum` property).
 */
export type JSONSchemaFragmentIsEnum<T extends JSONSchema7> = T extends JSONSchemaEnumFragment ? true : false;
/**
 * Infers a value type from a JSON schema enum definition, as the union of all enumerated values
 */
export type JSONSchemaEnumFragmentType<T extends JSONSchemaNotCollectionFragment> = T extends { enum: infer E extends ReadonlyArray<unknown> }
  ? E[number]
  : unknown;
