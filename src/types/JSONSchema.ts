/**
 * Overrides for JSON Schema types to make certain properties optional and compatible with the project's requirements: Due to a requirement of referencing
 * a JSON schema as a constant, certain properties need to be optionally read-only.
 */

import type { JSONSchema7 as OriginalJSONSchema7, JSONSchema7Definition as OriginalJSONSchema7Definition } from 'json-schema';

type DeepOptionallyReadOnly<T> = {
  readonly [K in keyof T]?: DeepOptionallyReadOnly<T[K]>;
};

// Overrides model definitions
export type JSONSchema7 = DeepOptionallyReadOnly<OriginalJSONSchema7>;
