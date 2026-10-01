/**
 * Typescript utilities for type inference from a JSON schema definition of an enum type
 */

import type { JSONSchemaFragmentEnum } from './JSONSchema';
import { JSONSchemaWrapper } from './TSSchema';

/**
 * Infers enum type from JSON schema definition
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaEnumType<T extends JSONSchemaFragmentEnum | JSONSchemaWrapper> = never; // FIXME: Implement type inference
