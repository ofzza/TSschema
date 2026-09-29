/**
 * Typescript utilities for type inference from a JSON schema definition of a const type
 */

import type { JSONSchemaConst } from './JSONSchema';
import { JSONSchemaWrapper } from './TSSchema';

/**
 * Infers const type from JSON schema definition
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type TSSchemaConstType<T extends JSONSchemaConst | JSONSchemaWrapper> = never; // FIXME: Implement type inference
