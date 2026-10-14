// Type inference utilities
export type * from './schema/index.js';

// Runtime reflection: the `reflect` entry point, the reflection classes it creates, the type descriptors they describe their types by (with their
// constraints) and their annotations (exported as types only)
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
  TSSchemaModelPropertyDescriptor,
  TSSchemaReferenceTypeDescriptor,
  TSSchemaAnyOfTypeDescriptor,
  TSSchemaAllOfTypeDescriptor,
  TSSchemaOneOfTypeDescriptor,
  TSSchemaNotTypeDescriptor,
  TSSchemaPrimitiveConstraints,
  TSSchemaNumberConstraints,
  TSSchemaStringConstraints,
  TSSchemaArrayConstraints,
  TSSchemaObjectConstraints,
  TSSchemaAnnotations,
  TSSchemaDecoratorDescriptor,
  TSSchemaDecoratorValue,
} from './reflection/index.js';
