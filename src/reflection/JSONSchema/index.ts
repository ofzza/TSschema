/**
 * Runtime reflection of JSON schema fragments, mirroring the type utilities in `src/schema/JSONSchema/`: a reflection class per fragment kind, each
 * parsing its fragment's contents on construction, and a router reflecting a fragment of any kind by every reflection class matching it.
 *
 * Reflection starts from `reflectJSONSchema`, which reflects any schema as an array of reflections, one per fragment kind its root matches. A schema
 * with `$defs` is reflected as a collection (`JSONSchemaCollectionFragmentReflect`) among them, which reflects each of its fragments by name, and against
 * which every `$ref` is resolved.
 * `reflectJSONSchemaCollection` reflects a collection as that collection reflection alone.
 */

export { JSONSchemaPrimitiveTypeNames, isJSONSchemaPrimitiveTypeName, isJSONSchemaObject } from './JSONSchema7.js';
export { JSONSchemaCollectionFragmentReflect, type JSONSchemaCollectionReflectedFragment } from './CollectionFragment.js';
export {
  JSONSchemaFragmentReflect,
  getJSONSchemaFragmentTypeBranches,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentReflectOptions,
} from './Fragment.js';
export {
  reflectJSONSchema,
  reflectJSONSchemaCollection,
  type JSONSchemaReflection,
  createJSONSchemaFragmentReflections,
  createJSONSchemaNestedFragmentReflections,
  type JSONSchemaFragmentReflection,
  type JSONSchemaNestedFragmentReflections,
  type JSONSchemaNestedFragmentsReflections,
  type JSONSchemaReflectedFragment,
} from './FragmentReflections.js';
export { JSONSchemaModelFragmentReflect } from './ModelFragment.js';
export { JSONSchemaConstFragmentReflect } from './ConstFragment.js';
export { JSONSchemaEnumFragmentReflect } from './EnumFragment.js';
export { JSONSchemaPrimitiveTypeFragmentReflect } from './PrimitiveTypeFragment.js';
export { JSONSchemaNullTypeFragmentReflect } from './NullTypeFragment.js';
export { JSONSchemaArrayTypeFragmentReflect } from './ArrayTypeFragment.js';
export { JSONSchemaObjectTypeFragmentReflect } from './ObjectTypeFragment.js';
export { JSONSchemaAllOfTypeFragmentReflect } from './AllOfTypeFragment.js';
export { JSONSchemaAnyOfTypeFragmentReflect } from './AnyOfTypeFragment.js';
export { JSONSchemaOneOfTypeFragmentReflect } from './OneOfTypeFragment.js';
export { JSONSchemaNotTypeFragmentReflect } from './NotTypeFragment.js';
export { JSONSchemaReferenceFragmentReflect } from './ReferenceFragment.js';
