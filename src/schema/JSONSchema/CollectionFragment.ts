/**
 * Typescript utilities for telling JSON schema collections (schemas containing `$defs`) apart from other JSON schema fragments, and for getting the
 * names of a collection's fragments.
 */

import type { JSONSchema7 } from './JSONSchema7.js';

/**
 * Determines if a JSON schema fragment is a collection (i.e., contains a `$defs` property).
 */
export type JSONSchemaFragmentIsCollection<T extends JSONSchema7> = T extends { $defs: infer U }
  ? U extends Record<string, JSONSchema7>
    ? true
    : false
  : false;
/**
 * Represents a JSON schema collection, which is any schema fragment containing a `$defs` property.
 */
export type JSONSchemaCollection = JSONSchema7 & { $defs: Record<string, JSONSchema7> };
/**
 * Gets the names of all fragments defined in a JSON schema collection's `$defs`. The default, unspecified collection infers `string | number`.
 */
export type JSONSchemaFragmentName<T extends JSONSchemaCollection = JSONSchemaCollection> = keyof T['$defs'];
/**
 * Determines if a JSON schema fragment is a definition (i.e., not a collection).
 */
export type JSONSchemaFragmentIsNotCollection<T extends JSONSchema7> = JSONSchemaFragmentIsCollection<T> extends true ? false : true;
/**
 * Represents a JSON schema definition, which is any schema fragment that is not a collection.
 */
export type JSONSchemaNotCollectionFragment = JSONSchema7 & { $defs?: never };
