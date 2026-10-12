// Type inference utilities
export type * from './schema/index.js';

// Runtime reflection: the `reflect` entry point, the reflection classes it creates and the type descriptors they describe their types by (exported as
// types only)
export type { TSSchemaFragmentReflection, TSSchemaDefinitionReflection, TSSchemaPropertyReflection } from './reflection/index.js';
export { reflect } from './reflection/index.js';
export type {
  TSSchemaTypeDescriptor,
  TSSchemaUnknownTypeDescriptor,
  TSSchemaConstTypeDescriptor,
  TSSchemaEnumTypeDescriptor,
  TSSchemaPrimitiveTypeDescriptor,
  TSSchemaNullTypeDescriptor,
  TSSchemaArrayTypeDescriptor,
  TSSchemaRecordTypeDescriptor,
  TSSchemaModelTypeDescriptor,
  TSSchemaReferenceTypeDescriptor,
  TSSchemaAnyOfTypeDescriptor,
  TSSchemaAllOfTypeDescriptor,
  TSSchemaOneOfTypeDescriptor,
  TSSchemaNotTypeDescriptor,
} from './reflection/index.js';
