/**
 * Runtime facets of JSON schema fragments, mirroring the type utilities in `src/schema/JSONSchema/`: a facet class per fragment kind, each
 * parsing its fragment's contents on construction, and a router parsing a fragment of any kind by every facet class matching it.
 *
 * Parsing starts from `parseJSONSchema`, which parses any schema as an array of facets, one per fragment kind its root matches. A schema
 * with `$defs` is parsed as a collection (`JSONSchemaCollectionFragmentFacet`) among them, which parses each of its fragments by name, and against
 * which every `$ref` is resolved.
 * `parseJSONSchemaCollection` parses a collection as that collection facet alone.
 */

export {
  JSONSchemaPrimitiveTypeNames,
  isJSONSchemaPrimitiveTypeName,
  isJSONSchemaObject,
  getJSONSchemaValueName,
  type JSONSchemaValueName,
} from './JSONSchema7.js';
export { JSONSchemaCollectionFragmentFacet, type JSONSchemaCollectionParsedFragment } from './CollectionFragment.js';
export {
  JSONSchemaFragmentFacet,
  getJSONSchemaFragmentTypeBranches,
  type JSONSchemaCollectionRootFragment,
  type JSONSchemaFragmentFacetOptions,
} from './Fragment.js';
export {
  parseJSONSchema,
  parseJSONSchemaCollection,
  type JSONSchemaFacet,
  createJSONSchemaFragmentFacets,
  createJSONSchemaNestedFragmentFacets,
  type JSONSchemaFragmentFacetOf,
  type JSONSchemaNestedFragmentFacets,
  type JSONSchemaNestedFragmentsFacets,
  type JSONSchemaParsedFragment,
} from './FragmentFacets.js';
export { JSONSchemaModelFragmentFacet } from './ModelFragment.js';
export { JSONSchemaConstFragmentFacet } from './ConstFragment.js';
export { JSONSchemaEnumFragmentFacet } from './EnumFragment.js';
export { JSONSchemaPrimitiveTypeFragmentFacet } from './PrimitiveTypeFragment.js';
export { JSONSchemaNullTypeFragmentFacet } from './NullTypeFragment.js';
export { JSONSchemaArrayTypeFragmentFacet } from './ArrayTypeFragment.js';
export { JSONSchemaObjectTypeFragmentFacet } from './ObjectTypeFragment.js';
export { JSONSchemaAllOfTypeFragmentFacet } from './AllOfTypeFragment.js';
export { JSONSchemaAnyOfTypeFragmentFacet } from './AnyOfTypeFragment.js';
export { JSONSchemaOneOfTypeFragmentFacet } from './OneOfTypeFragment.js';
export { JSONSchemaNotTypeFragmentFacet } from './NotTypeFragment.js';
export { JSONSchemaReferenceFragmentFacet } from './ReferenceFragment.js';
