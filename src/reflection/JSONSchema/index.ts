/**
 * Runtime nodes of JSON schema fragments, mirroring the type utilities in `src/schema/JSONSchema/`: a node class per fragment kind, each
 * parsing its fragment's contents on construction, and a router parsing a fragment of any kind by every node class matching it.
 *
 * Parsing starts from `parseJSONSchema`, which parses any schema as an array of nodes, one per fragment kind its root matches. A schema
 * with `$defs` is parsed as a collection (`JSONSchemaCollectionFragmentNode`) among them, which parses each of its fragments by name, and against
 * which every `$ref` is resolved.
 * `parseJSONSchemaCollection` parses a collection as that collection node alone.
 */

export { JSONSchemaPrimitiveTypeNames, isJSONSchemaPrimitiveTypeName, isJSONSchemaObject } from './JSONSchema7.js';
export { JSONSchemaCollectionFragmentNode, type JSONSchemaCollectionParsedFragment } from './CollectionFragment.js';
export {
  JSONSchemaFragmentNode,
  getJSONSchemaFragmentTypeBranches,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentNodeOptions,
} from './Fragment.js';
export {
  parseJSONSchema,
  parseJSONSchemaCollection,
  type JSONSchemaNode,
  createJSONSchemaFragmentNodes,
  createJSONSchemaNestedFragmentNodes,
  type JSONSchemaFragmentNodeOf,
  type JSONSchemaNestedFragmentNodes,
  type JSONSchemaNestedFragmentsNodes,
  type JSONSchemaParsedFragment,
} from './FragmentNodes.js';
export { JSONSchemaModelFragmentNode } from './ModelFragment.js';
export { JSONSchemaConstFragmentNode } from './ConstFragment.js';
export { JSONSchemaEnumFragmentNode } from './EnumFragment.js';
export { JSONSchemaPrimitiveTypeFragmentNode } from './PrimitiveTypeFragment.js';
export { JSONSchemaNullTypeFragmentNode } from './NullTypeFragment.js';
export { JSONSchemaArrayTypeFragmentNode } from './ArrayTypeFragment.js';
export { JSONSchemaObjectTypeFragmentNode } from './ObjectTypeFragment.js';
export { JSONSchemaAllOfTypeFragmentNode } from './AllOfTypeFragment.js';
export { JSONSchemaAnyOfTypeFragmentNode } from './AnyOfTypeFragment.js';
export { JSONSchemaOneOfTypeFragmentNode } from './OneOfTypeFragment.js';
export { JSONSchemaNotTypeFragmentNode } from './NotTypeFragment.js';
export { JSONSchemaReferenceFragmentNode } from './ReferenceFragment.js';
