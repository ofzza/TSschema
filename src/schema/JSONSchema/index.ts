/**
 * Typescript utilities for inferring value types from JSON schema fragments.
 *
 * Builds on an override of the JSON Schema Draft 7 type which makes every property optionally read-only, so that schemas can be referenced as `as const`
 * constants and keep their literal types for inference.
 */

export type { JSONSchema7, JSONSchemaPrimitiveTypeName, JSONSchemaPrimitiveType, JSONSchemaPrimitiveTypeFromName } from './JSONSchema7.js';
export type {
  JSONSchemaFragmentIsCollection,
  JSONSchemaCollection,
  JSONSchemaFragmentName,
  JSONSchemaFragmentIsNotCollection,
  JSONSchemaNotCollectionFragment,
} from './CollectionFragment.js';
export type { JSONSchemaFragmentType } from './Fragment.js';
export type { JSONSchemaModelFragment, JSONSchemaFragmentIsModel, JSONSchemaFragmentPropertyName, JSONSchemaModelFragmentType } from './ModelFragment.js';
export type { JSONSchemaConstFragment, JSONSchemaFragmentIsConst, JSONSchemaConstFragmentType } from './ConstFragment.js';
export type { JSONSchemaEnumFragment, JSONSchemaFragmentIsEnum, JSONSchemaEnumFragmentType } from './EnumFragment.js';
export type { JSONSchemaPrimitiveTypeFragment, JSONSchemaFragmentIsPrimitiveType, JSONSchemaPrimitiveTypeFragmentType } from './PrimitiveTypeFragment.js';
export type { JSONSchemaArrayTypeFragment, JSONSchemaFragmentIsArrayType, JSONSchemaArrayTypeFragmentType } from './ArrayTypeFragment.js';
export type { JSONSchemaObjectTypeFragment, JSONSchemaFragmentIsObjectType, JSONSchemaObjectTypeFragmentType } from './ObjectTypeFragment.js';
export type { JSONSchemaAllOfTypeFragment, JSONSchemaFragmentIsAllOfType, JSONSchemaAllOfTypeFragmentType } from './AllOfTypeFragment.js';
export type { JSONSchemaAnyOfTypeFragment, JSONSchemaFragmentIsAnyOfType, JSONSchemaAnyOfTypeFragmentType } from './AnyOfTypeFragment.js';
export type { JSONSchemaOneOfTypeFragment, JSONSchemaFragmentIsOneOfType, JSONSchemaOneOfTypeFragmentType } from './OneOfTypeFragment.js';
export type { JSONSchemaNotTypeFragment, JSONSchemaFragmentIsNotType, JSONSchemaNotTypeFragmentType } from './NotTypeFragment.js';
export type { JSONSchemaReferenceFragment, JSONSchemaFragmentIsReference, JSONSchemaReferenceFragmentType } from './ReferenceFragment.js';
