/**
 * Runtime reflection of JSON schemas. The package's main entry re-exports `reflect`, and as types only the reflection classes, the type descriptors (with
 * their constraints) and the annotations; everything else here (the facets, property lookup, the descriptor and annotation builders) is internal.
 *
 * Re-exports the JSON schema fragment facets in `./JSONSchema/` (the parsed form of a schema), the TSSchema* reflection classes wrapping them (`reflect`
 * reflecting a schema's root, its definitions and properties), the type descriptors describing their types, and the annotations read from their fragments.
 */

export * from './JSONSchema/index.js';
export * from './TSSchemaReflection.js';
export * from './TypeDescriptor.js';
export * from './Annotations.js';
