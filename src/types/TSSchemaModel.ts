/**
 * Typescript utilities for type inference from a JSON schema definition of a model type
 */

import type { JSONSchemaFragmentModel, JSONSchemaFragmentNotCollection } from './JSONSchema';
import { JSONSchemaWrapper, UnwrapJSONSchemaWrapper } from './TSSchema';

/**
 * Provides the type for the name of a JSON schema definition model property from within the JSON schema
 */
export type TSPropertyName<T extends JSONSchemaFragmentNotCollection | JSONSchemaWrapper = JSONSchemaFragmentNotCollection> =
  UnwrapJSONSchemaWrapper<T> extends infer U extends JSONSchemaFragmentModel ? keyof U['properties'] : string | number;

/**
 * Infers model type from JSON schema definition
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaModelType<T extends JSONSchemaFragmentModel | JSONSchemaWrapper> = never; // FIXME: Implement type inference
