/**
 * Runtime reflection of JSON schemas. The package's main entry re-exports `reflect` and the reflection classes (as types only); everything else here
 * (the facets, property lookup) is internal.
 *
 * Re-exports the JSON schema fragment facets in `./JSONSchema/` (the parsed form of a schema), and the TSSchema* reflection classes wrapping them
 * (`reflect` reflecting a schema's root, its definitions and properties).
 */

export * from './JSONSchema/index.js';
export * from './TSSchemaReflection.js';
