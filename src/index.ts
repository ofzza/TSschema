// Type inference utilities
export type * from './schema/index.js';

// Runtime reflection: the `reflect` entry point, and the reflection classes it creates (exported as types only)
export type { TSSchemaFragmentReflection, TSSchemaDefinitionReflection, TSSchemaPropertyReflection } from './reflection/index.js';
export { reflect } from './reflection/index.js';
